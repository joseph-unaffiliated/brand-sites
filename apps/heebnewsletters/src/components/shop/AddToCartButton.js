"use client";

import { useState } from "react";
import { useCart } from "@/context/CartContext";

/**
 * Adds one variant to the cart and opens the drawer. `product`/`variant` feed
 * analytics and the drawer's confirmation only.
 */
export default function AddToCartButton({
  variantId,
  product,
  variant,
  quantity = 1,
  disabled = false,
  className = "button button-primary",
  label = "Add to cart",
  soldOutLabel = "Sold out",
  available = true,
}) {
  const { addItem } = useCart();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const isDisabled = disabled || !available || !variantId || busy;

  const onClick = async () => {
    if (isDisabled) return;
    setBusy(true);
    setFailed(false);
    try {
      await addItem(variantId, quantity, { product, variant });
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  let text = label;
  if (!available) text = soldOutLabel;
  else if (busy) text = "Adding…";
  else if (failed) text = "Try again";

  return (
    <button type="button" className={className} onClick={onClick} disabled={isDisabled} aria-busy={busy}>
      {text}
    </button>
  );
}
