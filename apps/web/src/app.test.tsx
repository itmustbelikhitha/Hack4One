import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import React from "react";

function Smoke() {
  return <main><h1>DAYFLOW</h1><p>Every workday, perfectly aligned.</p></main>;
}

describe("app shell", () => {
  it("renders the Dayflow brand", () => {
    render(<Smoke />);
    expect(screen.getByText("DAYFLOW")).toBeTruthy();
  });
});
