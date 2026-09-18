// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { CartProvider, useCart } from "./CartContext";

function CartProbe() {
  const { addItem, cart, itemCount } = useCart();
  return <div><button onClick={() => void addItem("sakina:amethyst-stone:default")}>add amethyst</button><output>{`${itemCount}:${cart?.subtotal.amount ?? "0"}:${cart?.items[0]?.productTitle ?? ""}`}</output></div>;
}

describe("SAKINA local cart", () => {
  beforeEach(() => window.localStorage.clear());

  it("uses the in-site catalog price and persists the bag locally", async () => {
    render(<CartProvider><CartProbe /></CartProvider>);
    fireEvent.click(screen.getByRole("button", { name: "add amethyst" }));
    await waitFor(() => expect(screen.getByText("1:560.00:حجر جمشت هادئ")).toBeTruthy());
    expect(window.localStorage.getItem("sakina:local-cart")).toContain("amethyst-stone");
    expect(window.localStorage.getItem("sakina:local-cart")).toContain("sakina-local-cart");
  });
});
