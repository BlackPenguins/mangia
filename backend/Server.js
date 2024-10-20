import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';

import booksRoutes from './routes/books.js';
import recipesRoutes from './routes/recipes.js';
import menuRoutes from './routes/menu.js';
import setupRoutes from './routes/setup.js';
import tagRoutes from './routes/tags.js';
import ingredientTagRoutes from './routes/ingredientTags.js';
import ingredientDepartmentRoutes from './routes/ingredientDepartment.js';
import shoppingListItemRoutes from './routes/shoppingListItem.js';
import shoppingListExtraRoutes from './routes/shoppingListExtra.js';
import storeRoutes from './routes/store.js';
import migrationRoutes from './routes/migration.js';

// We start the client-side by running: npm run start
// We start the server-side by running: nodemon (something that runs an auto-updating nodejs)

// This is the server that runs on NodeJS. It will be our API talks to our database. Requests from react come in, NodeJS processes the type of API call, it gets
// the data from MySQL, and the data is returned

// React should NOT have direct access with a database because all that code is client-side and viewable by the user.

// We start the server typing 'nodemon'. A special package that will start NodeJS but if the file changes it will update the server without a restart needed.
// We installed nodemon with 'npm install -g nodemon' - the global flag so it's added to our path and can be accessible from command line in Windows
// Each time you do something like 'npm install mysql' it's installing the module for this project only, you'll see the added dependencies in the package.json file.

dotenv.config();
const port = process.env.MANGIA_BACKEND_PORT;

const app = express();

// We are sending this back in all responses saying it's allowed to be used by our client
// If we didn't provide this, the browser would see the origins were different ports and immediately reject it
// This is like our stamp of approval in the response: "Hey Browser, we allow things to be sent back to port X."
app.use(
	cors({
		origin: `http://mangia-frontend:${process.env.MANGIA_FRONTEND_PORT}`,
	})
);

// Does the parsing for the req.body
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb' }));
// app.use(bodyParser.json({ limit: '20mb' }));

app.use('/thumbs', express.static('./images/thumbnails'));
app.use('/attachments', express.static('./images/attachments'));

// TODO: make /adminRoutes/adminBookRoutes
// TODO: make /publicRoutes/bookRoutes
// the router.use(checkAuthMiddleware); needs to go here between the two
app.use(booksRoutes);
app.use(recipesRoutes);
app.use(menuRoutes);
app.use(setupRoutes);
app.use(tagRoutes);
app.use(ingredientTagRoutes);
app.use(ingredientDepartmentRoutes);
app.use(shoppingListItemRoutes);
app.use(shoppingListExtraRoutes);
app.use(storeRoutes);
app.use(migrationRoutes);

app.listen(port, () => {
	console.log(`Mangia-Server is now running on ${port}`);
});
