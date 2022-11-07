param (
    [string][parameter(Mandatory=$true)]$name
)

dotnet ef migrations add $name -c DataContext -o Migrations