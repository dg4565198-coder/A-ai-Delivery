# Servidor Web Local Nativo do Windows para o Sistema Rotta do Açaí
$port = 3000
$url = "http://localhost:$port/"
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add($url)

try {
    $listener.Start()
} catch {
    # Se a porta 3000 estiver ocupada, tenta 3001
    $port = 3001
    $url = "http://localhost:$port/"
    $listener = New-Object System.Net.HttpListener
    $listener.Prefixes.Add($url)
    $listener.Start()
}

Write-Host ""
Write-Host "==========================================================" -ForegroundColor DarkMagenta
Write-Host "          ROTTA DO ACAI - SISTEMA INICIADO COM SUCESSO!    " -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor DarkMagenta
Write-Host ""
Write-Host " [1] Cardapio Digital do Cliente:  $url" -ForegroundColor Green
Write-Host " [2] Painel de Gestao da Loja:     ${url}painel.html" -ForegroundColor Cyan
Write-Host ""
Write-Host " Abrindo no seu navegador padrao agora..." -ForegroundColor White
Write-Host " Mantenha esta janela aberta enquanto estiver usando o app." -ForegroundColor Gray
Write-Host " (Para fechar o sistema, basta fechar esta janela preta)" -ForegroundColor Gray
Write-Host ""

Start-Process $url
Start-Sleep -Milliseconds 600
Start-Process "${url}painel.html"

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $localPath = $request.Url.LocalPath.TrimStart('/')
        if ([string]::IsNullOrEmpty($localPath)) { $localPath = "index.html" }
        
        $localPath = $localPath -replace '/', '\'
        $filePath = Join-Path $PSScriptRoot $localPath
        
        if (Test-Path $filePath -PathType Leaf) {
            $content = [System.IO.File]::ReadAllBytes($filePath)
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $contentType = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".json" { "application/json; charset=utf-8" }
                ".jpg"  { "image/jpeg" }
                ".jpeg" { "image/jpeg" }
                ".png"  { "image/png" }
                Default { "application/octet-stream" }
            }
            $response.ContentType = $contentType
            $response.ContentLength64 = $content.Length
            $response.OutputStream.Write($content, 0, $content.Length)
        } else {
            $response.StatusCode = 404
        }
        $response.Close()
    } catch {
        # Continua escutando
    }
}
