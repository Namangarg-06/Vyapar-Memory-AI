param(
    [string]$Message = "update"
)

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  Vyapar Memory AI — 1-Click Push & Live Deploy" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Stage all changes
Write-Host "1. Staging changes..." -ForegroundColor Yellow
git add .

# 2. Commit
Write-Host "2. Committing with message: '$Message'..." -ForegroundColor Yellow
git commit -m "$Message"

# 3. Push to GitHub
Write-Host "3. Pushing to GitHub (main)..." -ForegroundColor Yellow
git push origin main

Write-Host "`n✅ Successfully pushed to https://github.com/Namangarg-06/Vyapar-Memory-AI.git!" -ForegroundColor Green
Write-Host "🚀 GitHub Actions CI/CD is now automatically testing, building, and deploying live!" -ForegroundColor Green
