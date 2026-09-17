$port = 8080
$listener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Any, $port)
$listener.Start()
Write-Host "TCP_SERVER_READY on port $port"

while ($true) {
    try {
        $client = $listener.AcceptTcpClient()
        $stream = $client.GetStream()
        $reader = [System.IO.StreamReader]::new($stream)
        $writer = [System.IO.BinaryWriter]::new($stream)

        $requestLine = $reader.ReadLine()
        if (-not $requestLine) { $client.Close(); continue }

        $parts = $requestLine.Split(' ')
        $rawPath = if ($parts.Length -gt 1) { $parts[1] } else { "/" }
        $path = $rawPath.Split('?')[0].TrimStart('/')
        if ([string]::IsNullOrEmpty($path)) { $path = "index.html" }
        $path = $path.Replace('/', '\')

        # Lê o restante dos headers
        while (-not [string]::IsNullOrEmpty($reader.ReadLine())) {}

        $filePath = Join-Path $PSScriptRoot $path
        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = switch ($ext) {
                ".html" { "text/html; charset=utf-8" }
                ".css"  { "text/css; charset=utf-8" }
                ".js"   { "application/javascript; charset=utf-8" }
                ".jpg"  { "image/jpeg" }
                ".jpeg" { "image/jpeg" }
                ".png"  { "image/png" }
                Default { "application/octet-stream" }
            }
            $header = "HTTP/1.1 200 OK`r`nContent-Type: $mime`r`nContent-Length: $($bytes.Length)`r`nAccess-Control-Allow-Origin: *`r`nConnection: close`r`n`r`n"
            $headerBytes = [System.Text.Encoding]::UTF8.GetBytes($header)
            $writer.Write($headerBytes)
            $writer.Write($bytes)
        } else {
            $notFound = [System.Text.Encoding]::UTF8.GetBytes("HTTP/1.1 404 Not Found`r`nContent-Length: 9`r`nConnection: close`r`n`r`nNot Found")
            $writer.Write($notFound)
        }
        $writer.Flush()
        $client.Close()
    } catch {
        # ignore error
    }
}
