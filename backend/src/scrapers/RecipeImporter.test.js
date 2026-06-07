import { describe, it, expect } from "vitest";
import { consolidateIngredients, convertFractionToDecimal, getDecimal, getFractionForDisplay, getSummarizedIngredientQuantity, getTeaspoonQuantity, parseIngredient, UNIT_TYPE } from "./RecipeImporter";

describe("RecipeImporter", () => {
    describe("parseIngredient", () => {
        it("keeps the unit", () => {
            assertExtracted(parseIngredient("1 cups flour"), "1", "cups", "flour", 1, 48, UNIT_TYPE.Volume);
            assertExtracted(parseIngredient("1 cup flour"), "1", "cup", "flour", 1, 48, UNIT_TYPE.Volume);
            assertExtracted(parseIngredient("1 tablespoon flour"), "1", "tablespoon", "flour", 1, 3, UNIT_TYPE.Volume);
            assertExtracted(parseIngredient("1 tablespoons flour"), "1", "tablespoons", "flour", 1, 3, UNIT_TYPE.Volume);
            assertExtracted(parseIngredient("1 teaspoon flour"), "1", "teaspoon", "flour", 1, 1, UNIT_TYPE.Volume);
            assertExtracted(parseIngredient("1 teaspoons flour"), "1", "teaspoons", "flour", 1, 1, UNIT_TYPE.Volume);
        });

        it("parses ingredients with valid units with whole numbers", () => {
            assertExtracted(parseIngredient("2 cups flour"), "2", "cups", "flour", 2, 96, UNIT_TYPE.Volume);
            assertExtracted(parseIngredient("2 tb apples"), "2", "tb", "apples", 2, 6, UNIT_TYPE.Volume);
            assertExtracted(parseIngredient("2 tsp garlic"), "2", "tsp", "garlic", 2, 2, UNIT_TYPE.Volume);
            assertExtracted(parseIngredient("2 oz onion"), "2", "oz", "onion", 2, 2, UNIT_TYPE.Weight_Imperial);
            assertExtracted(parseIngredient("2 lb banana"), "2", "lb", "banana", 2, 32, UNIT_TYPE.Weight_Imperial);
            assertExtracted(parseIngredient("2 g onion"), "2", "g", "onion", 2, 2, UNIT_TYPE.Weight_Metric);
            assertExtracted(parseIngredient("2 grams onion"), "2", "grams", "onion", 2, 2, UNIT_TYPE.Weight_Metric);
            assertExtracted(parseIngredient("2 kg banana"), "2", "kg", "banana", 2, 2000, UNIT_TYPE.Weight_Metric);
            assertExtracted(parseIngredient("2 kilogram banana"), "2", "kilogram", "banana", 2, 2000, UNIT_TYPE.Weight_Metric);
            assertExtracted(parseIngredient("2 kilograms banana"), "2", "kilograms", "banana", 2, 2000, UNIT_TYPE.Weight_Metric);
        });

        it("parses ingredients with valid units with fractions", () => {
            assertExtracted(parseIngredient("1/2 cups flour"), "1/2", "cups", "flour", 0.5, 24, UNIT_TYPE.Volume);
            assertExtracted(parseIngredient("1/2 tb apples"), "1/2", "tb", "apples", 0.5, 1.5, UNIT_TYPE.Volume);
            assertExtracted(parseIngredient("1/2 tsp garlic"), "1/2", "tsp", "garlic", 0.5, 0.5, UNIT_TYPE.Volume);
            assertExtracted(parseIngredient("1/2 oz onion"), "1/2", "oz", "onion", 0.5, 0.5, UNIT_TYPE.Weight_Imperial);
            assertExtracted(parseIngredient("1/2 lb banana"), "1/2", "lb", "banana", 0.5, 8, UNIT_TYPE.Weight_Imperial);
            assertExtracted(parseIngredient("1/2 g onion"), "1/2", "g", "onion", 0.5, 0.5, UNIT_TYPE.Weight_Metric);
            assertExtracted(parseIngredient("1/2 grams onion"), "1/2", "grams", "onion", 0.5, 0.5, UNIT_TYPE.Weight_Metric);
            assertExtracted(parseIngredient("1/2 kg banana"), "1/2", "kg", "banana", 0.5, 500, UNIT_TYPE.Weight_Metric);
            assertExtracted(parseIngredient("1/2 kilograms banana"), "1/2", "kilograms", "banana", 0.5, 500, UNIT_TYPE.Weight_Metric);
            assertExtracted(parseIngredient("1/2 kilogram banana"), "1/2", "kilogram", "banana", 0.5, 500, UNIT_TYPE.Weight_Metric);
        });

        it("parses ingredients with valid units with mixed fractions", () => {
            assertExtracted(parseIngredient("1 1/2 cups flour"), "1 1/2", "cups", "flour", 1.5, 72, UNIT_TYPE.Volume);
            assertExtracted(parseIngredient("1 1/2 tb apples"), "1 1/2", "tb", "apples", 1.5, 4.5, UNIT_TYPE.Volume);
            assertExtracted(parseIngredient("1 1/2 tsp garlic"), "1 1/2", "tsp", "garlic", 1.5, 1.5, UNIT_TYPE.Volume);
            assertExtracted(parseIngredient("1 1/2 oz onion"), "1 1/2", "oz", "onion", 1.5, 1.5, UNIT_TYPE.Weight_Imperial);
            assertExtracted(parseIngredient("1 1/2 lb banana"), "1 1/2", "lb", "banana", 1.5, 24, UNIT_TYPE.Weight_Imperial);
            assertExtracted(parseIngredient("1 1/2 g onion"), "1 1/2", "g", "onion", 1.5, 1.5, UNIT_TYPE.Weight_Metric);
            assertExtracted(parseIngredient("1 1/2 grams onion"), "1 1/2", "grams", "onion", 1.5, 1.5, UNIT_TYPE.Weight_Metric);
            assertExtracted(parseIngredient("1 1/2 kg banana"), "1 1/2", "kg", "banana", 1.5, 1500, UNIT_TYPE.Weight_Metric);
            assertExtracted(parseIngredient("1 1/2 kilogram banana"), "1 1/2", "kilogram", "banana", 1.5, 1500, UNIT_TYPE.Weight_Metric);
            assertExtracted(parseIngredient("1 1/2 kilograms banana"), "1 1/2", "kilograms", "banana", 1.5, 1500, UNIT_TYPE.Weight_Metric);
        });

        it("parses ingredients with no units", () => {
            assertExtracted(parseIngredient("2 flour"), "2", null, "flour", 2, 2, UNIT_TYPE.Count);
            assertExtracted(parseIngredient("1/2 flour"), "1/2", null, "flour", 0.5, 0.5, UNIT_TYPE.Count);
            assertExtracted(parseIngredient("3 1/2 flour"), "3 1/2", null, "flour", 3.5, 3.5, UNIT_TYPE.Count);
        });

        it("handles missing units", () => {
            assertExtracted(parseIngredient("2 tsps flour"), "2", null, "tsps flour", 2, 2, UNIT_TYPE.Count, false); // Valid, it thinks the tsps is part of the ingredient name
            assertExtracted(parseIngredient("2/abc tsp flour"), null, null, "2/abc tsp flour", null, null, UNIT_TYPE.Count, true);
        });
    });

    describe("getDecimal", () => {
        it("must be a fraction", () => {
            expect(getDecimal("21", true)).toEqual(null);
            expect(getDecimal("1/2", true)).toEqual(0.5);
            expect(getDecimal("abc", true)).toEqual(null);
        });

        it("must NOT be a fraction", () => {
            expect(getDecimal("21", false)).toEqual(21);
            expect(getDecimal("1/2", false)).toEqual(null);
            expect(getDecimal("abc", false)).toEqual(null);
        });

        it("must does not matter if fraction", () => {
            expect(getDecimal("21", null)).toEqual(21);
            expect(getDecimal("1/2", null)).toEqual(0.5);
            expect(getDecimal("abc", null)).toEqual(null);
        });

        it("returns the decimals for fractions", () => {
            expect(getDecimal("1/2", null)).toEqual(0.5);
            expect(getDecimal("1/4", null)).toEqual(0.25);
            expect(getDecimal("1/3", null)).toEqual(0.33333333);
            expect(getDecimal("2/3", null)).toEqual(0.66666666);
            expect(getDecimal("1/8", null)).toEqual(0.125);
            expect(getDecimal("3/4", null)).toEqual(0.75);
            expect(getDecimal("1/12", null)).toEqual(null);
            expect(getDecimal("1/abc", null)).toEqual(null);
        });

        it("returns the decimals for whole numbers", () => {
            expect(getDecimal("1", null)).toEqual(1);
            expect(getDecimal("12", null)).toEqual(12);
            expect(getDecimal("30", null)).toEqual(30);
            expect(getDecimal("abc", null)).toEqual(null);
        });
    });

    describe("convertFractionToDecimal", () => {
        it("parses whole numbers", () => {
            expect(convertFractionToDecimal("1")).toEqual(1);
            expect(convertFractionToDecimal("0")).toEqual(0);
            expect(convertFractionToDecimal("-1")).toEqual(-1);
        });

        it('parses fractions', () => {
            expect(convertFractionToDecimal("1/2")).toEqual(0.5);
            expect(convertFractionToDecimal("1/4")).toEqual(0.25);
            expect(convertFractionToDecimal("1/3")).toEqual(0.33333333);
            expect(convertFractionToDecimal("2/3")).toEqual(0.66666666);
            expect(convertFractionToDecimal("1/8")).toEqual(0.125);
            expect(convertFractionToDecimal("3/4")).toEqual(0.75);
        });

        it('parses mixed fractions', () => {
            expect(convertFractionToDecimal("1 1/2")).toEqual(1.5);
            expect(convertFractionToDecimal("2 1/4")).toEqual(2.25);
            expect(convertFractionToDecimal("7 1/3")).toEqual(7.33333333);
            expect(convertFractionToDecimal("5 2/3")).toEqual(5.66666666);
            expect(convertFractionToDecimal("9 1/8")).toEqual(9.125);
            expect(convertFractionToDecimal("1 3/4")).toEqual(1.75);
        });

        it('fails to parse unsupported fractions', () => {
            expect(convertFractionToDecimal("11/2")).toEqual(null);
            expect(convertFractionToDecimal("2 1/12")).toEqual(null);
            expect(convertFractionToDecimal("1/12")).toEqual(null);
        });

        it('fails to parse two fractions', () => {
            expect(convertFractionToDecimal("1/2 1/4")).toEqual(null);
        });

        it('fails to parse empty space', () => {
            expect(convertFractionToDecimal("")).toEqual(null);
            expect(convertFractionToDecimal("   ")).toEqual(null);
        });

        it('fails to parse three numbers', () => {
            expect(convertFractionToDecimal("1/1 2 3")).toEqual(null);
            expect(convertFractionToDecimal("1 1/2 3")).toEqual(null);
            expect(convertFractionToDecimal("1 2 1/3")).toEqual(null);
            expect(convertFractionToDecimal("1 2 3")).toEqual(null);
            expect(convertFractionToDecimal("1/1 1/2 1/3")).toEqual(null);
        });

        it('fails to parse fraction then whole number', () => {
            expect(convertFractionToDecimal("1/2 2")).toEqual(null);
        });

        it('fails to parse whole number then whole number', () => {
            expect(convertFractionToDecimal("1 2")).toEqual(null);
        });

        it('fails to parse NaN', () => {
            expect(convertFractionToDecimal("1/abc")).toEqual(null);
            expect(convertFractionToDecimal("abc/abc")).toEqual(null);
            expect(convertFractionToDecimal("abc/4")).toEqual(null);
            expect(convertFractionToDecimal("abc")).toEqual(null);
            expect(convertFractionToDecimal("abc 1/2")).toEqual(null);
            expect(convertFractionToDecimal("abc 3")).toEqual(null);
            expect(convertFractionToDecimal("2 1/abc")).toEqual(null);
            expect(convertFractionToDecimal("2 abc")).toEqual(null);
        });
    });


    describe("getFractionForDisplay", () => {
        it("returns fractions", () => {
            expect(getFractionForDisplay(1)).toEqual("1");
            expect(getFractionForDisplay(2)).toEqual("2");
            expect(getFractionForDisplay(0.5)).toEqual('1/2');
            expect(getFractionForDisplay(0.25)).toEqual('1/4');
            expect(getFractionForDisplay(0.33333333)).toEqual('1/3');
            expect(getFractionForDisplay(0.66666666)).toEqual('2/3');
            expect(getFractionForDisplay(0.125)).toEqual('1/8');
            expect(getFractionForDisplay(0.75)).toEqual('3/4');
            expect(getFractionForDisplay(1.5)).toEqual('1 1/2');
        });
    });

    describe("getSummarizedIngredientQuantity", () => {
        it("returns blank for no teaspoon quantity (missing units)", () => {
            expect(getSummarizedIngredientQuantity({})).toEqual("");
            expect(getSummarizedIngredientQuantity({ teaspoonQuantity: null })).toEqual("");
        });


        describe('count', () => {
            it("returns for whole units", () => {
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Count, teaspoonQuantity: 12 })).toEqual("12"); // Unit should be ignored
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Count, teaspoonQuantity: 12 })).toEqual("12");
            });
        });

        describe('volume', () => {
            it("finds the closest fraction, exactly a cup", () => {
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Volume, teaspoonQuantity: 48 })).toEqual("1 cups");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Volume, teaspoonQuantity: 96 })).toEqual("2 cups");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Volume, teaspoonQuantity: 480 })).toEqual("10 cups");
            });

            it("finds the closest fraction, larger than 1 cup", () => {
                // 1 below the threshold so it rounds down
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Volume, teaspoonQuantity: 48 + 15 })).toEqual("1 1/4 cup");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Volume, teaspoonQuantity: 48 + 23 })).toEqual("1 1/3 cup");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Volume, teaspoonQuantity: 48 + 31 })).toEqual("1 1/2 cup");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Volume, teaspoonQuantity: 48 + 35 })).toEqual("1 2/3 cup");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Volume, teaspoonQuantity: 48 + 47 })).toEqual("1 3/4 cup");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Volume, teaspoonQuantity: 48 + 0.25 })).toEqual("1 cups 1/4 teaspoon");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Volume, teaspoonQuantity: 48 + 0.50 })).toEqual("1 cups 1/2 teaspoon");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Volume, teaspoonQuantity: 48 + 3 })).toEqual("1 cups 1 tablespoon");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Volume, teaspoonQuantity: 48 + 6 })).toEqual("1 cups 2 tablespoon");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Volume, teaspoonQuantity: 48 + 9 })).toEqual("1 cups 3 tablespoon");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Volume, teaspoonQuantity: 48 + 11 })).toEqual("1 cups 4 tablespoon");
            });

            it("finds the closest fraction, smallerlarger than 1 cup", () => {
                // 1 below the threshold so it rounds down
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Volume, teaspoonQuantity: 15 })).toEqual("1/4 cup");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Volume, teaspoonQuantity: 23 })).toEqual("1/3 cup");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Volume, teaspoonQuantity: 31 })).toEqual("1/2 cup");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Volume, teaspoonQuantity: 35 })).toEqual("2/3 cup");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Volume, teaspoonQuantity: 47 })).toEqual("3/4 cup");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Volume, teaspoonQuantity: 0.25 })).toEqual("1/4 teaspoon");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Volume, teaspoonQuantity: 0.50 })).toEqual("1/2 teaspoon");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Volume, teaspoonQuantity: 3 })).toEqual("1 tablespoon");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Volume, teaspoonQuantity: 6 })).toEqual("2 tablespoon");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Volume, teaspoonQuantity: 9 })).toEqual("3 tablespoon");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Volume, teaspoonQuantity: 11 })).toEqual("4 tablespoon");
            });
        })

        describe('weight - imperial', () => {
            it("finds the closest fraction, exactly a pound", () => {
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Imperial, teaspoonQuantity: 16 })).toEqual("1 lbs");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Imperial, teaspoonQuantity: 32 })).toEqual("2 lbs");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Imperial, teaspoonQuantity: 160 })).toEqual("10 lbs");
            });

            it("finds the closest fraction, larger than 1 pound", () => {
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Imperial, teaspoonQuantity: 16 + 1 })).toEqual("1 lbs 1 ounces");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Imperial, teaspoonQuantity: 16 + 2 })).toEqual("1 lbs 2 ounces");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Imperial, teaspoonQuantity: 16 + 3 })).toEqual("1 lbs 3 ounces");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Imperial, teaspoonQuantity: 16 + 4 })).toEqual("1 lbs 4 ounces");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Imperial, teaspoonQuantity: 16 + 5 })).toEqual("1 lbs 5 ounces");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Imperial, teaspoonQuantity: 16 + 6 })).toEqual("1 lbs 6 ounces");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Imperial, teaspoonQuantity: 16 + 7 })).toEqual("1 lbs 7 ounces");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Imperial, teaspoonQuantity: 16 + 8 })).toEqual("1 lbs 8 ounces");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Imperial, teaspoonQuantity: 16 + 15 })).toEqual("1 lbs 15 ounces");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Imperial, teaspoonQuantity: 16 + 16 })).toEqual("2 lbs");
            });

            it("finds the closest fraction, smallerlarger than 1 cup", () => {
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Imperial, teaspoonQuantity: 1 })).toEqual("1 ounces");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Imperial, teaspoonQuantity: 2 })).toEqual("2 ounces");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Imperial, teaspoonQuantity: 3 })).toEqual("3 ounces");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Imperial, teaspoonQuantity: 4 })).toEqual("4 ounces");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Imperial, teaspoonQuantity: 5 })).toEqual("5 ounces");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Imperial, teaspoonQuantity: 6 })).toEqual("6 ounces");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Imperial, teaspoonQuantity: 7 })).toEqual("7 ounces");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Imperial, teaspoonQuantity: 8 })).toEqual("8 ounces");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Imperial, teaspoonQuantity: 15 })).toEqual("15 ounces");
            });
        })

        describe('weight - metric', () => {
            it("finds the closest fraction, exactly a kg", () => {
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Metric, teaspoonQuantity: 1000, unit: "kg" })).toEqual("1 kg");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Metric, teaspoonQuantity: 2000, unit: "kg" })).toEqual("2 kg");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Metric, teaspoonQuantity: 10000, unit: "kg" })).toEqual("10 kg");
            });

            it("finds the closest fraction, larger than 1 kg", () => {
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Metric, teaspoonQuantity: 1000 + 100, unit: "kg" })).toEqual("1 kg 100 grams");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Metric, teaspoonQuantity: 1000 + 200, unit: "kg" })).toEqual("1 kg 200 grams");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Metric, teaspoonQuantity: 1000 + 300, unit: "kg" })).toEqual("1 kg 300 grams");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Metric, teaspoonQuantity: 1000 + 400, unit: "kg" })).toEqual("1 kg 400 grams");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Metric, teaspoonQuantity: 1000 + 500, unit: "kg" })).toEqual("1 kg 500 grams");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Metric, teaspoonQuantity: 1000 + 600, unit: "kg" })).toEqual("1 kg 600 grams");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Metric, teaspoonQuantity: 1000 + 700, unit: "kg" })).toEqual("1 kg 700 grams");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Metric, teaspoonQuantity: 1000 + 800, unit: "kg" })).toEqual("1 kg 800 grams");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Metric, teaspoonQuantity: 1000 + 900, unit: "kg" })).toEqual("1 kg 900 grams");
            });

            it("finds the closest fraction, smallerlarger than 1 kg", () => {
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Metric, teaspoonQuantity: 100 })).toEqual("100 grams");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Metric, teaspoonQuantity: 200 })).toEqual("200 grams");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Metric, teaspoonQuantity: 300 })).toEqual("300 grams");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Metric, teaspoonQuantity: 400 })).toEqual("400 grams");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Metric, teaspoonQuantity: 500 })).toEqual("500 grams");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Metric, teaspoonQuantity: 600 })).toEqual("600 grams");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Metric, teaspoonQuantity: 700 })).toEqual("700 grams");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Metric, teaspoonQuantity: 800 })).toEqual("800 grams");
                expect(getSummarizedIngredientQuantity({ unitType: UNIT_TYPE.Weight_Metric, teaspoonQuantity: 900 })).toEqual("900 grams");
            });
        })
    });

    describe("consolidateIngredients", () => {
        it("returns only ingredients that have tags", () => {
            expect(consolidateIngredients([{}])).toEqual([]);
            expect(consolidateIngredients([])).toEqual([]);

            const ing = consolidateIngredients([
                {
                    tagName: 'flour',
                    tagID: 10,
                },
                {
                    tagName: 'eggs',
                    tagID: null,
                    recipeName: "AAA"
                },
                {
                    tagName: 'onions',
                    recipeName: "AAA"
                }
            ]);

            expect(ing).toHaveLength(1);
            expect(ing[0].name).toEqual('flour');
            expect(ing[0].tagID).toEqual(10);
        });

        it("combines two ingredients that are volumes", () => {
            const ing = consolidateIngredients([
                {
                    tagName: 'flour',
                    tagID: 10,
                    unitType: UNIT_TYPE.Volume,
                    teaspoonQuantity: 48,
                    recipeName: "AAA"
                    
                },
                {
                    tagName: 'flour',
                    tagID: 10,
                    unitType: UNIT_TYPE.Volume,
                    teaspoonQuantity: 24,
                    recipeName: "BBB"
                },
            ]);

            expect(ing).toHaveLength(1);
            expect(ing[0].name).toEqual('flour');
            expect(ing[0].tagID).toEqual(10);
            expect(ing[0].teaspoonQuantity).toEqual(72);
            expect(ing[0].recipeCount).toEqual(2);
            expect(ing[0].recipeNames).toEqual("AAA, BBB");
        });

        it("combines two ingredients that are count", () => {
            const ing = consolidateIngredients([
                {
                    tagName: 'apples',
                    tagID: 10,
                    unitType: UNIT_TYPE.Count,
                    teaspoonQuantity: 2,
                    recipeName: "AAA"
                    
                },
                {
                    tagName: 'apples',
                    tagID: 10,
                    unitType: UNIT_TYPE.Count,
                    teaspoonQuantity: 6,
                    recipeName: "BBB"
                },
            ]);

            expect(ing).toHaveLength(1);
            expect(ing[0].name).toEqual('apples');
            expect(ing[0].tagID).toEqual(10);
            expect(ing[0].teaspoonQuantity).toEqual(8);
            expect(ing[0].recipeCount).toEqual(2);
            expect(ing[0].recipeNames).toEqual("AAA, BBB");
        });

        it("combines two ingredients that are weight - imperial", () => {
            const ing = consolidateIngredients([
                {
                    tagName: 'apples',
                    tagID: 10,
                    unitType: UNIT_TYPE.Weight_Imperial,
                    teaspoonQuantity: 15,
                    recipeName: "AAA"
                    
                },
                {
                    tagName: 'apples',
                    tagID: 10,
                    unitType: UNIT_TYPE.Weight_Imperial,
                    teaspoonQuantity: 6,
                    recipeName: "BBB"
                },
            ]);

            expect(ing).toHaveLength(1);
            expect(ing[0].name).toEqual('apples');
            expect(ing[0].tagID).toEqual(10);
            expect(ing[0].teaspoonQuantity).toEqual(21);
            expect(ing[0].recipeCount).toEqual(2);
            expect(ing[0].recipeNames).toEqual("AAA, BBB");
        });

        it("combines two ingredients that are weight - metric", () => {
            const ing = consolidateIngredients([
                {
                    tagName: 'apples',
                    tagID: 10,
                    unitType: UNIT_TYPE.Weight_Metric,
                    teaspoonQuantity: 1000,
                    recipeName: "AAA"
                    
                },
                {
                    tagName: 'apples',
                    tagID: 10,
                    unitType: UNIT_TYPE.Weight_Metric,
                    teaspoonQuantity: 600,
                    recipeName: "BBB"
                },
            ]);

            expect(ing).toHaveLength(1);
            expect(ing[0].name).toEqual('apples');
            expect(ing[0].tagID).toEqual(10);
            expect(ing[0].teaspoonQuantity).toEqual(1600);
            expect(ing[0].recipeCount).toEqual(2);
            expect(ing[0].recipeNames).toEqual("AAA, BBB");
        });

        it("does not combine two ingredients that are volume and weight unit types", () => {
            const ing = consolidateIngredients([
                {
                    tagName: 'beef',
                    tagID: 10,
                    unitType: UNIT_TYPE.Weight_Imperial,
                    teaspoonQuantity: 2,
                    recipeName: "AAA"
                    
                },
                {
                    tagName: 'beef',
                    tagID: 10,
                    unitType: UNIT_TYPE.Volume,
                    teaspoonQuantity: 6,
                    recipeName: "BBB"
                },
            ]);

            expect(ing).toHaveLength(2);
            expect(ing[0].name).toEqual('beef');
            expect(ing[0].tagID).toEqual(10);
            expect(ing[0].teaspoonQuantity).toEqual(2);
            expect(ing[0].recipeCount).toEqual(1);
            expect(ing[0].recipeNames).toEqual("AAA");
            expect(ing[0].unitType).toEqual("weight_imperial");

            expect(ing[1].name).toEqual('beef');
            expect(ing[1].tagID).toEqual(10);
            expect(ing[1].teaspoonQuantity).toEqual(6);
            expect(ing[1].recipeCount).toEqual(1);
            expect(ing[1].recipeNames).toEqual("BBB");
            expect(ing[1].unitType).toEqual("volume");
        });

         it("does not combine two ingredients that are metric and imperial weight unit types", () => {
            const ing = consolidateIngredients([
                {
                    tagName: 'beef',
                    tagID: 10,
                    unitType: UNIT_TYPE.Weight_Imperial,
                    teaspoonQuantity: 2,
                    recipeName: "AAA"
                    
                },
                {
                    tagName: 'beef',
                    tagID: 10,
                    unitType: UNIT_TYPE.Weight_Metric,
                    teaspoonQuantity: 6,
                    recipeName: "BBB"
                },
            ]);

            expect(ing).toHaveLength(2);
            expect(ing[0].name).toEqual('beef');
            expect(ing[0].tagID).toEqual(10);
            expect(ing[0].teaspoonQuantity).toEqual(2);
            expect(ing[0].recipeCount).toEqual(1);
            expect(ing[0].recipeNames).toEqual("AAA");
            expect(ing[0].unitType).toEqual("weight_imperial");

            expect(ing[1].name).toEqual('beef');
            expect(ing[1].tagID).toEqual(10);
            expect(ing[1].teaspoonQuantity).toEqual(6);
            expect(ing[1].recipeCount).toEqual(1);
            expect(ing[1].recipeNames).toEqual("BBB");
            expect(ing[1].unitType).toEqual("weight_metric");
        });
    });

    describe("getTeaspoonQuantity", () => {
        it("returns unchanged whole units", () => {
            expect(getTeaspoonQuantity(1, null).teaspoonQuantity).toEqual(1);
            expect(getTeaspoonQuantity(0.25, null).teaspoonQuantity).toEqual(0.25);
            expect(getTeaspoonQuantity(4.25, null).teaspoonQuantity).toEqual(4.25);
        });

        it("returns teaspoons for cups", () => {
            const MEASUREMENTS = ['cups', 'cup', 'c', "CUPS"];
            assertTeaspoonQuantity(1, MEASUREMENTS, 48, UNIT_TYPE.Volume);
            assertTeaspoonQuantity(2, MEASUREMENTS, 96, UNIT_TYPE.Volume);
            assertTeaspoonQuantity(1.25, MEASUREMENTS, 60, UNIT_TYPE.Volume);
            assertTeaspoonQuantity(0.25, MEASUREMENTS, 12, UNIT_TYPE.Volume);
        });

        it("returns teaspoons for tablespoons", () => {
            const MEASUREMENTS = ['tb', 'tablespoon', 'tablespoons', 'tbsp', "TB"];
            assertTeaspoonQuantity(1, MEASUREMENTS, 3, UNIT_TYPE.Volume);
            assertTeaspoonQuantity(2, MEASUREMENTS, 6, UNIT_TYPE.Volume);
            assertTeaspoonQuantity(1.25, MEASUREMENTS, 3.75, UNIT_TYPE.Volume);
            assertTeaspoonQuantity(0.25, MEASUREMENTS, 0.75, UNIT_TYPE.Volume);
        });

        it("returns teaspoons for teaspoons", () => {
            const MEASUREMENTS = ['tsp', 'teaspoon', 'teaspoons', "TSP"];
            assertTeaspoonQuantity(1, MEASUREMENTS, 1, UNIT_TYPE.Volume);
            assertTeaspoonQuantity(2, MEASUREMENTS, 2, UNIT_TYPE.Volume);
            assertTeaspoonQuantity(1.25, MEASUREMENTS, 1.25, UNIT_TYPE.Volume);
            assertTeaspoonQuantity(0.25, MEASUREMENTS, 0.25, UNIT_TYPE.Volume);
        });

        it("returns ounces for pounds", () => {
            const MEASUREMENTS = ["pound", "pounds", 'lb', 'lbs', "LBS"];
            assertTeaspoonQuantity(1, MEASUREMENTS, 16, UNIT_TYPE.Weight_Imperial);
            assertTeaspoonQuantity(2, MEASUREMENTS, 32, UNIT_TYPE.Weight_Imperial);
            assertTeaspoonQuantity(1.25, MEASUREMENTS, 20, UNIT_TYPE.Weight_Imperial);
            assertTeaspoonQuantity(0.25, MEASUREMENTS, 4, UNIT_TYPE.Weight_Imperial);
        });

        it("returns ounces for ounces", () => {
            const MEASUREMENTS = ['ounce', 'ounces', 'oz', "OZ"];
            assertTeaspoonQuantity(1, MEASUREMENTS, 1, UNIT_TYPE.Weight_Imperial);
            assertTeaspoonQuantity(2, MEASUREMENTS, 2, UNIT_TYPE.Weight_Imperial);
            assertTeaspoonQuantity(1.25, MEASUREMENTS, 1.25, UNIT_TYPE.Weight_Imperial);
            assertTeaspoonQuantity(0.25, MEASUREMENTS, 0.25, UNIT_TYPE.Weight_Imperial);
        });

        it("returns grams for kilograms", () => {
            const MEASUREMENTS = ["kilograms", "kilogram", 'kg', "KG"];
            assertTeaspoonQuantity(1, MEASUREMENTS, 1000, UNIT_TYPE.Weight_Metric);
            assertTeaspoonQuantity(2, MEASUREMENTS, 2000, UNIT_TYPE.Weight_Metric);
            assertTeaspoonQuantity(1.25, MEASUREMENTS, 1250, UNIT_TYPE.Weight_Metric);
            assertTeaspoonQuantity(0.25, MEASUREMENTS, 250, UNIT_TYPE.Weight_Metric);
        });

        it("returns grams for grams", () => {
            const MEASUREMENTS = ['grams', 'g', "G"];
            assertTeaspoonQuantity(1, MEASUREMENTS, 1, UNIT_TYPE.Weight_Metric);
            assertTeaspoonQuantity(2, MEASUREMENTS, 2, UNIT_TYPE.Weight_Metric);
            assertTeaspoonQuantity(3, MEASUREMENTS, 3, UNIT_TYPE.Weight_Metric);
            assertTeaspoonQuantity(4, MEASUREMENTS, 4, UNIT_TYPE.Weight_Metric);
        });
    });

    const assertTeaspoonQuantity = (input, measurements, expectedOutput, expectedUnitType) => {
        for( const measurement of measurements ) {
            expect(getTeaspoonQuantity(input, measurement)).toEqual({
                teaspoonQuantity: expectedOutput,
                unitType: expectedUnitType
            });
        }
    }

    const assertExtracted = (result, expectedQuantity, expectedUnit, expectedIngredient, expectedDecimalQuantity, expectedTeaspoonQuantity, expectedUnitType, expectedMissingUnits = false) => {
        expect(result).toEqual({
            quantity: expectedQuantity,
            unit: expectedUnit,
            ingredient: expectedIngredient,
            decimalQuantity: expectedDecimalQuantity,
            teaspoonQuantity: expectedTeaspoonQuantity,
            isMissingUnits: expectedMissingUnits,
            unitType: expectedUnitType
        });
    }
});