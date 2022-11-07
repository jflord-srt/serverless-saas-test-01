export type TenantConfig = {
    tenantId: string,
    tenantName: string,
    tenantCode: string,
    cognitoUserPoolId: string,
    cognitoClientAppId: string,
} | null;