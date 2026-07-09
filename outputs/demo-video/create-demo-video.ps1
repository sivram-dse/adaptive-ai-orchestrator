param(
    [string]$ProjectRoot = "D:\adaptive-ai-orchestrator",
    [string]$VoiceName = "Microsoft Zira Desktop"
)

$ErrorActionPreference = "Stop"

$OutputDir = Join-Path $ProjectRoot "outputs\demo-video"
$AssetDir = Join-Path $OutputDir "assets"
$AudioDir = Join-Path $OutputDir "audio"
$PreviewDir = Join-Path $OutputDir "preview"
$PptxPath = Join-Path $OutputDir "adaptive-ai-orchestrator-demo-video.pptx"
$VideoPath = Join-Path $OutputDir "adaptive-ai-orchestrator-demo-video.mp4"

New-Item -ItemType Directory -Force -Path $OutputDir, $AudioDir, $PreviewDir | Out-Null

function ConvertTo-OleColor([int]$r, [int]$g, [int]$b) {
    return $r + ($g * 256) + ($b * 65536)
}

function Add-TextBox($slide, [string]$text, [double]$x, [double]$y, [double]$w, [double]$h, [int]$size, [bool]$bold, [int]$color) {
    $shape = $slide.Shapes.AddTextbox(1, $x, $y, $w, $h)
    $shape.TextFrame.WordWrap = $true
    $shape.TextFrame.MarginLeft = 10
    $shape.TextFrame.MarginRight = 10
    $shape.TextFrame.MarginTop = 6
    $shape.TextFrame.MarginBottom = 6
    $range = $shape.TextFrame.TextRange
    $range.Text = $text
    $range.Font.Name = "Aptos"
    $range.Font.Size = $size
    $range.Font.Bold = if ($bold) { -1 } else { 0 }
    $range.Font.Color.RGB = $color
    return $shape
}

function Add-Panel($slide, [double]$x, [double]$y, [double]$w, [double]$h, [int]$color, [double]$transparency) {
    $shape = $slide.Shapes.AddShape(1, $x, $y, $w, $h)
    $shape.Fill.ForeColor.RGB = $color
    $shape.Fill.Transparency = $transparency
    $shape.Line.Visible = 0
    return $shape
}

function Add-Screenshot($slide, [string]$fileName, [double]$x, [double]$y, [double]$w, [double]$h) {
    $path = Join-Path $AssetDir $fileName
    if (-not (Test-Path $path)) {
        throw "Missing screenshot asset: $path"
    }
    $pic = $slide.Shapes.AddPicture($path, $false, $true, $x, $y, $w, $h)
    $pic.Line.Visible = -1
    $pic.Line.ForeColor.RGB = ConvertTo-OleColor 103 232 249
    $pic.Line.Weight = 1.25
    return $pic
}

function New-WavNarration([object]$voice, [string]$text, [string]$path) {
    $stream = New-Object -ComObject SAPI.SpFileStream
    $stream.Open($path, 3, $false)
    $voice.AudioOutputStream = $stream
    [void]$voice.Speak($text)
    $stream.Close()
    $voice.AudioOutputStream = $null
}

function Get-WavDurationSeconds([string]$path) {
    [byte[]]$bytes = [System.IO.File]::ReadAllBytes($path)
    $byteRate = [BitConverter]::ToInt32($bytes, 28)
    for ($i = 12; $i -lt $bytes.Length - 8; $i += 1) {
        $chunk = [System.Text.Encoding]::ASCII.GetString($bytes, $i, 4)
        if ($chunk -eq "data") {
            $dataSize = [BitConverter]::ToInt32($bytes, $i + 4)
            return $dataSize / $byteRate
        }
    }
    return 12
}

# Keep visible currency copy in single-quoted strings. PowerShell expands
# dollar-prefixed values in double-quoted strings before PowerPoint sees them.
$slides = @(
    @{
        Image = "01_landing.png"
        Title = "Adaptive AI Orchestrator"
        Subtitle = "Cost-aware routing for enterprise AI workloads."
        Body = "The platform selects the cheapest acceptable execution path while preserving confidence, speed, and governance."
        Narration = "Most enterprise AI platforms route too many requests to large models or agent workflows. That works, but it is expensive, slower than necessary, and difficult to govern. Adaptive AI Orchestrator solves this by selecting the cheapest acceptable execution path for each request while preserving quality and confidence."
    },
    @{
        Image = "01_landing.png"
        Title = "Right-sized routing for every task"
        Subtitle = "Code, skills, LLMs, agents, and multi-agent workflows are all available."
        Body = "The decision engine evaluates complexity, reasoning depth, context, cost, latency, and confidence before selecting a route."
        Narration = "The platform evaluates every request by complexity, reasoning depth, context size, cost, latency, and confidence. Simple deterministic work can go to code. Reusable business tasks can go to skills. High-context synthesis can go to an LLM. Complex planning can still escalate to a single-agent or multi-agent workflow."
    },
    @{
        Image = "02_executive.png"
        Title = "ROI evidence from repeated trials"
        Subtitle = "35.3 percent lower execution cost and 25.1 percent lower latency."
        Body = 'Average cost dropped from $0.1800 to $0.1164 per request while maintaining 100 percent success in the controlled demo.'
        Narration = "The Executive Dashboard turns those routing decisions into business evidence. In repeated demo trials, the system reduced average cost from eighteen cents per request to about eleven point six cents, a thirty five point three percent reduction. Average latency dropped from four point three seconds to three point two two seconds, a twenty five point one percent improvement."
    },
    @{
        Image = "03_orchestrator.png"
        Title = "Live decisions are explainable"
        Subtitle = "Every response includes route, confidence, cost, latency, and rationale."
        Body = "This is important for enterprise governance: decisions are auditable, not hidden inside a black box."
        Narration = "In the live orchestrator, a user submits a prompt and the decision engine scores all available paths. The result includes the selected strategy, confidence, latency, actual cost, token usage, rationale, and rejected alternatives. This makes the system explainable, not just automated."
    },
    @{
        Image = "04_cost_intelligence.png"
        Title = "Benchmarks show selective escalation"
        Subtitle = "Simple work avoids agents; complex work still escalates when needed."
        Body = "JSON validation and email drafting are routed cheaply. Travel and enterprise migration planning still use agentic paths for quality."
        Narration = "The benchmark set covers five representative workloads: JSON validation, email drafting, research synthesis, travel planning, and enterprise migration planning. The first three show direct savings from avoiding unnecessary agents. The last two show quality-aware escalation, where agents are still used when the task truly requires them."
    },
    @{
        Image = "02_executive.png"
        Title = "Business value scales with volume"
        Subtitle = 'Projected at one million similar requests: $63.6K saved and 300 response-time hours avoided.'
        Body = "Production validation can connect this framework to real provider billing, latency, quality scores, and business outcomes."
        Narration = "The key business impact is responsible scale. At one million similar requests, the demo economics project about sixty three point six thousand dollars in execution-cost savings and roughly three hundred cumulative hours of response time saved. In production, the same framework can connect to real provider billing, latency, quality scores, and business outcomes."
    }
)

$voice = New-Object -ComObject SAPI.SpVoice
$selectedVoice = $voice.GetVoices() | Where-Object { $_.GetDescription() -like "$VoiceName*" } | Select-Object -First 1
if ($selectedVoice) {
    $voice.Voice = $selectedVoice
}
$voice.Rate = -1
$voice.Volume = 100

$powerPoint = New-Object -ComObject PowerPoint.Application
$powerPoint.Visible = -1
$presentation = $powerPoint.Presentations.Add()
$presentation.PageSetup.SlideWidth = 960
$presentation.PageSetup.SlideHeight = 540

$dark = ConvertTo-OleColor 10 18 32
$cyan = ConvertTo-OleColor 34 211 238
$white = ConvertTo-OleColor 248 250 252
$muted = ConvertTo-OleColor 203 213 225
$panel = ConvertTo-OleColor 15 23 42

for ($i = 0; $i -lt $slides.Count; $i += 1) {
    $data = $slides[$i]
    $slide = $presentation.Slides.Add($i + 1, 12)
    $slide.FollowMasterBackground = $false
    $slide.Background.Fill.ForeColor.RGB = $dark

    Add-Screenshot $slide $data.Image 400 50 520 290 | Out-Null
    Add-Panel $slide 36 50 332 410 $panel 0.05 | Out-Null
    Add-TextBox $slide $data.Title 50 66 292 112 27 $true $white | Out-Null
    Add-TextBox $slide $data.Subtitle 50 194 292 84 18 $false $cyan | Out-Null
    Add-TextBox $slide $data.Body 50 306 292 120 15 $false $muted | Out-Null

    Add-Panel $slide 400 370 520 66 $panel 0.12 | Out-Null
    Add-TextBox $slide "Explainable route selection with cost, latency, confidence, and rationale" 418 388 480 28 14 $false $cyan | Out-Null

    $wavPath = Join-Path $AudioDir ("slide-{0}.wav" -f ($i + 1))
    New-WavNarration $voice $data.Narration $wavPath
    $duration = [Math]::Ceiling((Get-WavDurationSeconds $wavPath) + 1.0)
    $audio = $slide.Shapes.AddMediaObject2($wavPath, $false, $true, 20, 500, 24, 24)
    $audio.AnimationSettings.PlaySettings.PlayOnEntry = $true
    $audio.AnimationSettings.PlaySettings.HideWhileNotPlaying = $true
    $slide.SlideShowTransition.AdvanceOnTime = $true
    $slide.SlideShowTransition.AdvanceTime = $duration
}

$presentation.SaveAs($PptxPath, 24)
$presentation.Export($PreviewDir, "PNG", 1280, 720)
$presentation.CreateVideo($VideoPath, $true, 6, 1080, 30, 85)

$timeoutAt = (Get-Date).AddMinutes(8)
while (($presentation.CreateVideoStatus -eq 1 -or $presentation.CreateVideoStatus -eq 2) -and (Get-Date) -lt $timeoutAt) {
    Start-Sleep -Seconds 2
}

$status = $presentation.CreateVideoStatus
$presentation.Save()
$presentation.Close()
$powerPoint.Quit()

[System.Runtime.InteropServices.Marshal]::ReleaseComObject($presentation) | Out-Null
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($powerPoint) | Out-Null

if ($status -ne 3 -or -not (Test-Path $VideoPath)) {
    throw "PowerPoint video export did not complete successfully. Status=$status"
}

[pscustomobject]@{
    PptxPath = $PptxPath
    VideoPath = $VideoPath
    VideoBytes = (Get-Item $VideoPath).Length
    SlideCount = $slides.Count
} | ConvertTo-Json
