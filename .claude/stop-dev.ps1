foreach ($p in 32092,22804,41252,39360) {
  try {
    Stop-Process -Id $p -Force -ErrorAction Stop
    Write-Output "stopped $p"
  } catch {
    Write-Output "could not stop $p"
  }
}
