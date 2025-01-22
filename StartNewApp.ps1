# Get the name of the parent folder
#$parentFolderName = Split-Path -Leaf (Get-Location)
#$parentFolderName = (Split-Path -Leaf (Get-Location)) -replace '_', '-'
$parentFolderName = ((Split-Path -Leaf (Get-Location)) -replace '_', '-').ToLower()

git add README.md
git commit -m "first commit"
git branch -M master
git push -u origin master

# Step 1: Add new remote link in git
git remote add template https://github.com/microMotion-ecosystem/nest_mongo_template.git
git merge template/master --no-stat -v --allow-unrelated-histories


# Step 2: Search and replace <APP_NAME> with the parent folder name
Get-ChildItem -Recurse -Include *.ts,*.json, .env, .env.* | ForEach-Object {
    (Get-Content $_.FullName) -replace '<APP_NAME>', $parentFolderName | Set-Content $_.FullName
}
