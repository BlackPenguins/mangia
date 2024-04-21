import express from 'express';
import { getPool } from '../database/utils.js';

const router = express.Router();

router.post('/api/setup/createTable/recipe', (req, res) => {
	simpleDBQuery(
		'Create Recipe',
		'CREATE TABLE Recipe (RecipeID INT AUTO_INCREMENT PRIMARY KEY, Name VarChar(50) NOT NULL, Category VarChar(50) NOT NULL, Description VarChar(3000) NOT NULL, URL VarChar(200) NOT NULL, BookID INT DEFAULT 0, Page VARCHAR(20) NOT NULL, Notes VARCHAR(1000) NOT NULL, Rating INT DEFAULT 1 NOT NULL, LastMade DATE, FOREIGN KEY (BookID) REFERENCES BOOK(BookID) )',
		res
	);
});

router.post('/api/setup/createTable/book', (req, res) => {
	simpleDBQuery('Create Book', 'CREATE TABLE Book (BookID INT AUTO_INCREMENT PRIMARY KEY, Name VarChar(50) NOT NULL, Description VarChar(100) DEFAULT NOT NULL)', res);
});

router.post('/api/setup/createTable/menu', (req, res) => {
	simpleDBQuery(
		'Create Menu',
		'CREATE TABLE MENU_DAY (MenuID INT AUTO_INCREMENT PRIMARY KEY, Day DATE NOT NULL, RecipeID INT NOT NULL, IsMade TINYINT NOT NULL, IsSkipped TINYINT NOT NULL, FOREIGN KEY (RecipeID) REFERENCES RECIPE(RecipeID) )',
		res
	);
});

router.post('/api/setup/createTable/ingredient', (req, res) => {
	simpleDBQuery(
		'Create Ingredient',
		'CREATE TABLE INGREDIENT (IngredientID INT AUTO_INCREMENT PRIMARY KEY, Amount INT NOT NULL, RecipeID INT NOT NULL, ItemID INT NOT NULL, FOREIGN KEY (RecipeID) REFERENCES RECIPE(RecipeID), FOREIGN KEY (ItemID) REFERENCES ITEM(ItemID) )',
		res
	);
});

router.post('/api/setup/createTable/item', (req, res) => {
	simpleDBQuery('Create Item', 'CREATE TABLE ITEM (ItemID INT AUTO_INCREMENT PRIMARY KEY, Name VARCHAR(50), Type VARCHAR(30))', res);
});

router.post('/api/setup/createTable/step', (req, res) => {
	simpleDBQuery(
		'Create Step',
		'CREATE TABLE STEP (StepNumber INT, RecipeID INT NOT NULL, Instruction VARCHAR(2000), FOREIGN KEY (RecipeID) REFERENCES RECIPE(RecipeID))',
		res
	);
});

router.post('/api/setup/createTable/tag', (req, res) => {
	simpleDBQuery('Create Tag', 'CREATE TABLE TAG (TagID INT AUTO_INCREMENT PRIMARY KEY, Name VARCHAR(50) NOT NULL )', res);
});

router.post('/api/setup/createTable/recipeTag', (req, res) => {
	simpleDBQuery(
		'Create RecipeTag',
		'CREATE TABLE RECIPE_TAG (RecipeID INT NOT NULL, TagID INT NOT NULL, Name VARCHAR(50) NOT NULL, FOREIGN KEY (RecipeID) REFERENCES RECIPE(RecipeID), FOREIGN KEY (TagID) REFERENCES TAG(TagID) )',
		res
	);
});

const simpleDBQuery = (label, sql, res) => {
	const pool = getPool();

	pool.query(sql, (error, result) => {
		if (error) {
			res.send('Error' + JSON.stringify(error));
		} else {
			res.send(label + ':' + JSON.stringify(result));
		}
	});
};

export default router;
