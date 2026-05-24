#!/bin/sh
set -e

echo "Waiting for database..."
sleep 2

echo "Pushing database schema..."
npx prisma db push --skip-generate --accept-data-loss
echo "Database ready!"

# Auto-import word books if IMPORT_BOOKS is set
# Values: "all" to import all books, or comma-separated book keys like "cet4,cet6,ielts"
# Available keys: cet4, cet6, ielts, postgrad, middle, high, toefl, gre, tem4, tem8, daily, business
if [ -n "$IMPORT_BOOKS" ]; then
  echo ""
  echo "============================================"
  echo "  Auto-importing word books: $IMPORT_BOOKS"
  echo "============================================"
  echo ""

  if [ "$IMPORT_BOOKS" = "all" ]; then
    node dist/scripts/importAll.js
  else
    # Split comma-separated values and import each
    IFS=',' 
    for book in $IMPORT_BOOKS; do
      book=$(echo "$book" | tr -d ' ')
      echo "Importing: $book"
      node dist/scripts/importAll.js "$book"
    done
    unset IFS
  fi

  echo ""
  echo "Word import complete!"
  echo ""
fi

echo "Starting server..."
exec node dist/src/index.js
