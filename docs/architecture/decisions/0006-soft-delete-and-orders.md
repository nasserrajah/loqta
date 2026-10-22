# ADR 0006: Soft-deleted products and transactional order lifecycle

Status: Accepted

## Context

Deleting a product would break historical order items and favorites. Orders must never be persisted
with a partial stock change, and cancellation must not double-restock.

## Decision

1. Admin product deletion sets `is_active = 0`. Public catalog queries hide inactive products and
   products in inactive categories; admin queries can include them.
2. Categories and brands are hard-deleted only when no products (including inactive products)
   reference them. This preserves the ability to reason about archived products.
3. Order creation runs in one transaction: reserve every line with a conditional stock decrement,
   insert the order and immutable item snapshots, then clear the cart. Any failure rolls back all
   changes.
4. Cancellation runs in one transaction: restock each item once, then set `cancelled`.
5. Status transitions are validated in the service using a fixed map:
   `pending → paid/cancelled`, `paid → processing/cancelled`, `processing → shipped/cancelled`,
   `shipped → delivered`. Terminal states cannot change.
6. Order items snapshot product name and unit price so later catalog edits do not rewrite history.

## Consequences

- Order history and stock remain consistent under failures and retries.
- Inactive products can still appear in admin views and past orders.
- A product can never be hard-deleted while order history exists; the REST API only exposes soft
  deletion.
