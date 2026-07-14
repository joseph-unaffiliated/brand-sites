"use client";

import { useState } from "react";
import styles from "./IngredientsChecklist.module.css";

/**
 * Ingredient list with tap-to-check-off (visual only, not persisted).
 * Ingredients are plain strings — this brand doesn't do quantities.
 */
export default function IngredientsChecklist({ ingredients }) {
  const [checked, setChecked] = useState(() => new Set());

  if (!Array.isArray(ingredients) || ingredients.length === 0) return null;

  const toggle = (index) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <ul className={styles.list}>
      {ingredients.map((ingredient, index) => {
        const isChecked = checked.has(index);
        return (
          <li key={index} className={styles.item}>
            <button
              type="button"
              className={`${styles.row} ${isChecked ? styles.checked : ""}`}
              onClick={() => toggle(index)}
              aria-pressed={isChecked}
            >
              <span className={styles.box} aria-hidden>
                {isChecked ? "✓" : ""}
              </span>
              <span className={styles.text}>{ingredient}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
