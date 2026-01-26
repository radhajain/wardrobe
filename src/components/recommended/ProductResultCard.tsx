import { ProductResult } from "../../types";
import "./ProductResultCard.css";

interface ProductResultCardProps {
  product: ProductResult;
}

/**
 * Card displaying a product search result
 */
export function ProductResultCard({ product }: ProductResultCardProps) {
  const formatPrice = (price: number | null, currency: string) => {
    if (price === null) return "Price unavailable";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(price);
  };

  return (
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      className="product-card"
    >
      <div className="product-card__image-container">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="product-card__image"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
              (
                e.target as HTMLImageElement
              ).nextElementSibling?.classList.remove(
                "product-card__placeholder--hidden",
              );
            }}
          />
        ) : null}
        <div
          className={`product-card__placeholder ${product.imageUrl ? "product-card__placeholder--hidden" : ""}`}
        >
          <span>No Image</span>
        </div>
      </div>

      <div className="product-card__content">
        <div className="product-card__header">
          <span className="product-card__retailer">
            {product.retailer}
            {product.isPreferredStore && (
              <span className="product-card__preferred" title="Preferred store">
                ★
              </span>
            )}
          </span>
          <span className="product-card__price">
            {formatPrice(product.price, product.currency)}
          </span>
        </div>

        <h3 className="product-card__name">{product.name}</h3>

        {product.availableSizes && product.availableSizes.length > 0 && (
          <div className="product-card__sizes">
            <span className="product-card__sizes-label">Sizes:</span>
            <span className="product-card__sizes-list">
              {product.availableSizes.join(", ")}
            </span>
          </div>
        )}

        <span className="product-card__link">View Product →</span>
      </div>
    </a>
  );
}
