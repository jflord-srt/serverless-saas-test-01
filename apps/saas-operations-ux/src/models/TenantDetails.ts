export type TenantDetails = {
    tenantId: string;
    tenantName: string;
    tenantCode: string;
    administratorSubject: string;
    administratorEmail: string;
    cognitoUserPoolId: string;
    cognitoUserPoolDomain: string;
    cognitoClientAppId: string;
    timestamp: number;
};
