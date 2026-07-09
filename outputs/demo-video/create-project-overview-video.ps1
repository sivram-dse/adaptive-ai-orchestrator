param(
    [string]$ProjectRoot = "D:\adaptive-ai-orchestrator",
    [string]$VoiceName = "Microsoft Zira Desktop"
)

$ErrorActionPreference = "Stop"

$OutputDir = Join-Path $ProjectRoot "outputs\demo-video"
$AssetDir = Join-Path $OutputDir "assets"
$AudioDir = Join-Path $OutputDir "audio-overview"
$PreviewDir = Join-Path $OutputDir "preview-overview"
$PptxPath = Join-Path $OutputDir "adaptive-ai-orchestrator-project-overview.pptx"
$VideoPath = Join-Path $OutputDir "adaptive-ai-orchestrator-project-overview.mp4"

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

function Add-Picture($slide, [string]$fileName, [double]$x, [double]$y, [double]$w, [double]$h, [bool]$border) {
    $path = Join-Path $AssetDir $fileName
    if (-not (Test-Path $path)) {
        $path = Join-Path $OutputDir $fileName
    }
    if (-not (Test-Path $path)) {
        throw "Missing visual asset: $fileName"
    }
    $pic = $slide.Shapes.AddPicture($path, $false, $true, $x, $y, $w, $h)
    if ($border) {
        $pic.Line.Visible = -1
        $pic.Line.ForeColor.RGB = ConvertTo-OleColor 103 232 249
        $pic.Line.Weight = 1.25
    } else {
        $pic.Line.Visible = 0
    }
    return $pic
}

function Add-MetricCard($slide, [string]$value, [string]$label, [double]$x, [double]$y, [double]$w, [double]$h, [int]$panel, [int]$cyan, [int]$muted) {
    $card = Add-Panel $slide $x $y $w $h $panel 0.02
    $card.Line.Visible = -1
    $card.Line.ForeColor.RGB = ConvertTo-OleColor 31 59 91
    $card.Line.Weight = 1
    Add-TextBox $slide $value ($x + 12) ($y + 8) ($w - 24) 34 23 $true $cyan | Out-Null
    Add-TextBox $slide $label ($x + 12) ($y + 42) ($w - 24) 24 11 $false $muted | Out-Null
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
        Image = "03_orchestrator.png"
        Title = "Adaptive AI Orchestrator"
        Subtitle = "A runtime control layer for enterprise AI."
        Body = "Routes each request to the lowest-cost execution path that still satisfies quality, latency, and confidence requirements."
        Footer = "Project overview for hackathon evaluation"
        Layout = "split"
        Narration = "Adaptive AI Orchestrator is a runtime control layer for enterprise AI. Instead of sending every request to an expensive model or agent workflow, it evaluates the request and chooses the most appropriate path for that workload."
    },
    @{
        Image = "01_landing.png"
        Title = "The problem"
        Subtitle = "Enterprise AI often overuses costly execution paths."
        Body = "Simple tasks do not always need large models or agents. Without routing, teams absorb avoidable cost, latency, and governance risk."
        Footer = "Goal: control cost without blindly reducing quality"
        Layout = "split"
        Narration = "The problem is common in enterprise AI adoption. Many platforms route too many tasks to large language models or agent workflows. That can work, but it increases cost, response time, and governance complexity, especially when the task could be solved by deterministic code or a reusable skill."
    },
    @{
        Image = "03_orchestrator.png"
        Title = "How it works"
        Subtitle = "The decision engine scores each path at runtime."
        Body = "It considers complexity, policy, cost, latency, confidence, and historical outcome signals before selecting Code, Skill, LLM, Agent, or Multi-Agent Workflow."
        Footer = "Every response includes route, rationale, cost, latency, confidence, and evaluated alternatives"
        Layout = "split"
        Narration = "At runtime, the decision engine classifies the request, applies policy constraints, estimates cost, latency, and confidence, and then selects the lowest cost acceptable execution strategy. The result includes the selected route, rationale, confidence, cost, latency, token usage, and evaluated alternatives."
    },
    @{
        Image = "02_executive.png"
        Title = "Business impact"
        Subtitle = "Measured savings from repeated demo trials."
        Body = 'The prototype reduced average cost from $0.1800 to $0.1164 per request, lowered average latency from 4.30 seconds to 3.22 seconds, and maintained 100 percent controlled demo success.'
        Footer = 'Projected at one million similar requests: about $63.6K saved and 300 response-time hours avoided'
        Layout = "metrics"
        Metrics = @(
            @("35.3%", "lower execution cost"),
            @("25.1%", "lower latency"),
            @("100%", "controlled demo success"),
            @('$63.6K', "projected savings / 1M")
        )
        Narration = "The business impact is visible in the analytics dashboard. In repeated demo trials, average execution cost dropped from eighteen cents to about eleven point six cents per request, a thirty five point three percent reduction. Average latency improved by twenty five point one percent, while maintaining a one hundred percent controlled demo success rate."
    },
    @{
        Image = "04_cost_intelligence.png"
        Title = "Built for governance"
        Subtitle = "Explainable routing makes AI spend auditable."
        Body = "Platform teams can monitor route mix, business teams can review ROI, and governance teams can inspect why each workload used a cheaper or more advanced path."
        Footer = "Designed for platform, product, FinOps, and AI governance stakeholders"
        Layout = "split"
        Narration = "The platform is designed for both technical and business stakeholders. Platform teams can integrate execution paths. Product owners and FinOps teams can monitor cost and latency. Governance teams can audit every decision because routing is explainable, not hidden inside a black box."
    },
    @{
        Image = "02_executive.png"
        Title = "Why it matters"
        Subtitle = "A foundation for an enterprise AI control plane."
        Body = "The hackathon build uses deterministic local demo adapters. In production, the same orchestration pattern can connect to real providers, billing telemetry, quality feedback, approval workflows, and enterprise policy controls."
        Footer = "Adaptive routing helps scale AI adoption with cost, quality, and governance under control"
        Layout = "split"
        Narration = "This hackathon build uses deterministic local demo adapters so judges can run it without external credentials. In production, the same framework can connect to real enterprise model providers, internal agents, billing data, quality feedback, approval workflows, and governance controls. That makes it a practical foundation for an enterprise AI control plane."
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

$dark = ConvertTo-OleColor 7 16 31
$cyan = ConvertTo-OleColor 34 211 238
$white = ConvertTo-OleColor 248 250 252
$muted = ConvertTo-OleColor 203 213 225
$panel = ConvertTo-OleColor 15 23 42
$gold = ConvertTo-OleColor 250 204 21

for ($i = 0; $i -lt $slides.Count; $i += 1) {
    $data = $slides[$i]
    $slide = $presentation.Slides.Add($i + 1, 12)
    $slide.FollowMasterBackground = $false
    $slide.Background.Fill.ForeColor.RGB = $dark

    if ($data.Layout -eq "hero") {
        Add-Picture $slide $data.Image 0 0 960 540 $false | Out-Null
        Add-Panel $slide 0 0 960 540 (ConvertTo-OleColor 4 10 20) 0.15 | Out-Null
        Add-Panel $slide 46 68 430 320 $panel 0.10 | Out-Null
        Add-TextBox $slide $data.Title 66 88 390 70 32 $true $white | Out-Null
        Add-TextBox $slide $data.Subtitle 66 170 390 64 20 $false $cyan | Out-Null
        Add-TextBox $slide $data.Body 66 250 390 96 16 $false $muted | Out-Null
    } elseif ($data.Layout -eq "metrics") {
        Add-Picture $slide $data.Image 444 58 470 264 $true | Out-Null
        Add-Panel $slide 36 48 360 422 $panel 0.05 | Out-Null
        Add-TextBox $slide $data.Title 54 64 320 58 29 $true $white | Out-Null
        Add-TextBox $slide $data.Subtitle 54 135 320 54 18 $false $cyan | Out-Null
        Add-TextBox $slide $data.Body 54 368 322 78 12 $false $muted | Out-Null
        Add-MetricCard $slide $data.Metrics[0][0] $data.Metrics[0][1] 54 204 150 74 $panel $cyan $muted
        Add-MetricCard $slide $data.Metrics[1][0] $data.Metrics[1][1] 222 204 150 74 $panel $cyan $muted
        Add-MetricCard $slide $data.Metrics[2][0] $data.Metrics[2][1] 54 280 150 74 $panel $cyan $muted
        Add-MetricCard $slide $data.Metrics[3][0] $data.Metrics[3][1] 222 280 150 74 $panel $gold $muted
    } else {
        Add-Picture $slide $data.Image 420 58 500 282 $true | Out-Null
        Add-Panel $slide 36 58 340 386 $panel 0.05 | Out-Null
        Add-TextBox $slide $data.Title 54 76 300 58 29 $true $white | Out-Null
        Add-TextBox $slide $data.Subtitle 54 150 300 70 18 $false $cyan | Out-Null
        Add-TextBox $slide $data.Body 54 250 300 116 15 $false $muted | Out-Null
    }

    Add-Panel $slide 420 382 500 60 $panel 0.12 | Out-Null
    Add-TextBox $slide $data.Footer 438 398 464 26 12 $false $cyan | Out-Null

    $wavPath = Join-Path $AudioDir ("overview-slide-{0}.wav" -f ($i + 1))
    New-WavNarration $voice $data.Narration $wavPath
    $duration = [Math]::Ceiling((Get-WavDurationSeconds $wavPath) + 1.0)
    $audio = $slide.Shapes.AddMediaObject2($wavPath, $false, $true, 18, 500, 24, 24)
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
