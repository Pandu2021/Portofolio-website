# =============================================================================
# tts.ps1 — offline text-to-speech with the voices built into Windows.
#
# Uses the Windows.Media.SpeechSynthesis (OneCore) API: no internet, no account,
# nothing leaves this computer. Reads a JSON file { voice, fallbackVoice, rate,
# scenes: [{ id, text }] } and writes <OutDir>\<id>.wav (PCM WAV) per scene.
#
#   powershell -NoProfile -ExecutionPolicy Bypass -File tts.ps1 -In lines.json -OutDir dir
# =============================================================================
param(
  [Parameter(Mandatory = $true)][string]$In,
  [Parameter(Mandatory = $true)][string]$OutDir
)
$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Media.SpeechSynthesis.SpeechSynthesizer, Windows.Media.SpeechSynthesis, ContentType = WindowsRuntime]
$null = [Windows.Storage.Streams.DataReader, Windows.Storage.Streams, ContentType = WindowsRuntime]

# WinRT async → .NET Task (PowerShell 5.1 has no await).
$asTaskGeneric = [System.WindowsRuntimeSystemExtensions].GetMethods() |
  Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' } |
  Select-Object -First 1
function Await($operation, [Type]$resultType) {
  $task = $asTaskGeneric.MakeGenericMethod($resultType).Invoke($null, @($operation))
  $null = $task.Wait(-1)
  return $task.Result
}

$config = Get-Content -Raw -Encoding UTF8 $In | ConvertFrom-Json
$voices = [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::AllVoices
$voice = $voices | Where-Object { $_.DisplayName -eq $config.voice } | Select-Object -First 1
if (-not $voice) { $voice = $voices | Where-Object { $_.DisplayName -eq $config.fallbackVoice } | Select-Object -First 1 }
if (-not $voice) { throw "Neither '$($config.voice)' nor '$($config.fallbackVoice)' is installed." }

$synth = New-Object Windows.Media.SpeechSynthesis.SpeechSynthesizer
$synth.Voice = $voice
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

foreach ($scene in $config.scenes) {
  # Escape the text for SSML, then speak it slightly slower than default for clarity.
  $text = [System.Security.SecurityElement]::Escape($scene.text)
  $ssml = "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-US'>" +
    "<prosody rate='$($config.rate)'>$text</prosody></speak>"
  $stream = Await ($synth.SynthesizeSsmlToStreamAsync($ssml)) ([Windows.Media.SpeechSynthesis.SpeechSynthesisStream])
  $size = [uint32]$stream.Size
  $reader = New-Object Windows.Storage.Streams.DataReader($stream.GetInputStreamAt(0))
  $null = Await ($reader.LoadAsync($size)) ([uint32])
  $bytes = New-Object byte[] $size
  $reader.ReadBytes($bytes)
  $reader.Dispose()
  $stream.Dispose()
  $path = Join-Path $OutDir "$($scene.id).wav"
  [IO.File]::WriteAllBytes($path, $bytes)
  Write-Output "$($scene.id)|$path|$($voice.DisplayName)"
}
$synth.Dispose()
