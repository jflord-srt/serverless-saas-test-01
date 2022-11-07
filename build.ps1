dotnet build --configuration Release "$PSScriptRoot\services\TenantManagement\TenantManagement.sln"

cd "$PSScriptRoot\apps\client-ux\"
npm install
npm run build
cd "$PSScriptRoot"

cd "$PSScriptRoot\apps\saas-operations-ux\"
npm install
npm run build
cd "$PSScriptRoot"

cd "$PSScriptRoot\cdk-resources\publish-sns-message-function\"
npm install
npm run build
cd "$PSScriptRoot"

mvn -f "$PSScriptRoot\cdk-resources\deploy-db-lambda-function\pom.xml" clean install compile assembly:single