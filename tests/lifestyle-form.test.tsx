import "@testing-library/jest-dom/vitest";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { LifestyleForm } from "@/components/LifestyleForm";

afterEach(() => {
  cleanup();
});

describe("LifestyleForm", () => {
  it("renders accessible labels and submits the selected household profile", () => {
    const onSubmit = vi.fn();
    render(
      <LifestyleForm
        city="New Delhi"
        isGenerating={false}
        onSubmit={onSubmit}
      />,
    );

    const childrenCheckbox = screen.getByLabelText(/Children/i);
    fireEvent.click(childrenCheckbox);

    const commuteSelect = screen.getByLabelText(/Primary Commute/i);
    fireEvent.change(commuteSelect, { target: { value: "car" } });

    const submitButton = screen.getByRole("button", {
      name: /Generate Personalized Action Plan/i,
    });
    fireEvent.click(submitButton);

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        city: "New Delhi",
        commuteMode: "car",
        householdMembers: expect.arrayContaining(["adults", "children"]),
      }),
    );
  });

  it("displays an accessible alert when all household checkboxes are unchecked", () => {
    const onSubmit = vi.fn();
    render(
      <LifestyleForm city="Noida" isGenerating={false} onSubmit={onSubmit} />,
    );

    const adultsCheckbox = screen.getByLabelText(/^Adults/i);
    fireEvent.click(adultsCheckbox);

    fireEvent.click(
      screen.getByRole("button", {
        name: /Generate Personalized Action Plan/i,
      }),
    );

    expect(screen.getByRole("alert")).toHaveTextContent(
      /Select at least one household member group/i,
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("disables submission and exposes aria-busy while generating", () => {
    render(
      <LifestyleForm city="New Delhi" isGenerating={true} onSubmit={vi.fn()} />,
    );

    const button = screen.getByRole("button", {
      name: /Generating Personalized Smog Action Plan/i,
    });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});
