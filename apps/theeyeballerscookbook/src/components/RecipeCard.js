import Image from "next/image";
import Link from "next/link";
import FavoriteButton from "@/components/FavoriteButton";
import { formatRecipeDate } from "@/lib/recipes";
import styles from "@/app/recipes/page.module.css";

export default function RecipeCard({ recipe }) {
  return (
    <article className={styles.issueCard}>
      <Link href={`/recipe/${recipe.slug}`} className={styles.issueCardLink}>
        <div className={styles.issueCardImage}>
          <Image
            src={recipe.mainImage}
            alt=""
            width={400}
            height={267}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
        <div className={styles.issueCardBody}>
          <div className={styles.recipeCardMeta}>
            <p className={styles.issueDate}>
              {recipe.category?.title
                ? recipe.category.title
                : formatRecipeDate(recipe.publishedDate) ?? "—"}
            </p>
            <FavoriteButton slug={recipe.slug} variant="card" />
          </div>
          <h3>{recipe.title}</h3>
          {recipe.description ? (
            <p className={styles.issueDek}>{recipe.description}</p>
          ) : recipe.ingredients?.length ? (
            <p className={styles.issueDek}>
              {recipe.ingredients.slice(0, 3).join(" · ")}
            </p>
          ) : null}
          <span className={styles.issueCta}>Get the recipe</span>
        </div>
      </Link>
    </article>
  );
}
