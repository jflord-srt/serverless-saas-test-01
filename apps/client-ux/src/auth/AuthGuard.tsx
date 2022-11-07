import { Navigate } from "react-router-dom";

export type AuthGuardProps = React.PropsWithChildren<{
  isAuthenticated: boolean;
}>;

export const AuthGuard = ({ isAuthenticated, children }: AuthGuardProps)  => {
  if (!isAuthenticated) {
    return <Navigate to="/" replace={true} />;
  }
  return (<>{children}</>)
};
