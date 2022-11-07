import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App";
import { AppConfig } from "./AppConfig";

const appConfig = {
    isDebug: true,
} as AppConfig;

test("renders learn react link", () => {
    render(<App id="app" appConfig={appConfig} />);
    const linkElement = screen.getByText(/learn react/i);
    expect(linkElement).toBeInTheDocument();
});
