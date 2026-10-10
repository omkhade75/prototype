# Restaurant Management System

Generated autonomously by **ORBIT AI Software Engineer**.

## Stack
- **Frontend**: Glassy Dark Responsive Dashboard (HTML5, CSS3, Modern ES Modules)
- **Backend**: Node.js, Express.js REST API
- **Database**: Local SQLite-compatible atomic JSON store

## API Endpoints
- `GET /api/health` — System status
- `GET /api/stats` — Revenue, order, and table metrics
- `GET /api/menu_items` — List menu
- `POST /api/menu_items` — Add new menu item
- `DELETE /api/menu_items/:id` — Delete item
- `GET /api/orders` — Orders feed
- `POST /api/orders` — Create new order
- `GET /api/tables` — Table occupancy status
- `GET /api/inventory` — Stock levels and alerts

## Running Tests
```bash
node --test tests/api.test.js
```

## Running the Application
```bash
node server.js
```
