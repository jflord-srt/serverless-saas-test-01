import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App";
import { AppConfig } from "./AppConfig";

const appConfig = {
    isDebug: true,
    appUrl: "http://localhost",
    apiUrl: "http://localhost/api",
    i18n: {
        fallbackLanguage: "en",
    },
} as AppConfig;

test("renders learn react link", () => {
    render(<App id="app" appConfig={appConfig} />);
    const linkElement = screen.getByText(/learn react/i);
    expect(linkElement).toBeInTheDocument();
});
