/*******************************************************************************  
 *     Copyright (c) 2023 TriggerReactor Team  
 *  
 *     This program is free software: you can redistribute it and/or modify  
 *     it under the terms of the GNU General Public License as published by  
 *     the Free Software Foundation, either version 3 of the License, or  
 *     (at your option) any later version.  
 *  
 *     This program is distributed in the hope that it will be useful,  
 *     but WITHOUT ANY WARRANTY; without even the implied warranty of  
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the  
 *     GNU General Public License for more details.  
 *  
 *     You should have received a copy of the GNU General Public License  
 *     along with this program. If not, see <http://www.gnu.org/licenses/>.  
 *******************************************************************************/

var Bukkit = Java.type("org.bukkit.Bukkit");
var Material = Java.type("org.bukkit.Material");
var ItemStack = Java.type("org.bukkit.inventory.ItemStack");
var NamespacedKey = Java.type("org.bukkit.NamespacedKey");
var ShapedRecipe = Java.type("org.bukkit.inventory.ShapedRecipe");
var Enchantment = Java.type("org.bukkit.enchantments.Enchantment");
var RecipeChoice = Java.type("org.bukkit.inventory.RecipeChoice");

function CEchangeCraft() {
    var ChangeCraftAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine) {
            var args = actionLine.split(";");
            if (args.length < 8) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_CRAFT ACTION: Invalid format! Correct format: change_craft: <recipe_id (for example: custom_sword)>;<action (ADD|REMOVE|CHANGE)>;<remove_namespace ('remove_namespace' is needed in order to get a specific place where the craft needs to be removed from, for example, if craft has the same name in different plugins (specify 'null' if you want to affect all recipes with 'recipe_id' id), it can be “Minecraft” (built-in minecraft crafts), “All” (any crafts in any namespaces), “CustomCrafting” (intended name of the plugin), “my_test_namespace” and any other plugins or your own made-up namespaces (this namespace can be used with REMOVE and CHANGE action (CHANGE is the same as removing with further adding)))>;<add_namespace ('add_namespace' is needed in order to get a specific place where the craft needs to be added, for example, if the craft has the same name in different plugins (specify 'null' if you want to add new recipe with default 'TriggerReactor' plugin namespace), it can be “Minecraft” (built-in minecraft crafts), “CustomCrafting” (intended name of the plugin), “my_test_namespace” and any other plugins or your own made-up namespaces (this namespace can be used with ADD and CHANGE action (CHANGE is the same as removing with further adding)))>;<craft_line_1>,<craft_line_2>,<craft_line_3> (for example: AAA, BAB, ABA, for empty elements use spaces);<result_item (supports some meta in format amount:name:lore:enchantments:custom_model_data (unnecessary options can be skipped), for example: DIAMOND_SWORD:1:§bMega Sword::SHARPNESS=1)>;<strict (true|dalse, whether the ingredients in the crafting process must match the specified ingredients in all respects, or whether only the material is sufficient)>;<ingredient_items (supports some meta in format amount:name:lore:enchantments:custom_model_data (unnecessary options can be skipped), for example: A,STICK:2:§cSuper-stick;B,DIAMOND:::::14)>");
                return;
            }
            
            function createItem(materialString) {
                var parts = materialString.split(":");
                var material = Material.valueOf(parts[0]);
                var amount = parts.length > 1 && parts[1] && parts[1] !== "" && parseInt(parts[1]) ? parseInt(parts[1]) : 1;
                var name = parts.length > 2 && parts[2] && parts[2] !== "" ? parts[2] : null;
                var lore = parts.length > 3 && parts[3] && parts[3] !== "" ? parts[3].split("|") : [];
                var enchantments = parts.length > 4 && parts[4] && parts[4] !== "" ? parts[4].split(",") : [];
                var customModelData = parts.length > 5 ? parts[5] !== "" && parseInt(parts[5]) : null;

                var item = new ItemStack(material, amount);
                var meta = item.getItemMeta();
                if (name) meta.setDisplayName(name);
                if (lore.length > 0) meta.setLore(lore);

                for (var i = 0; i < enchantments.length; i++) {
                    var enchParts = enchantments[i].split("=");
                    if (enchParts.length === 2) {
                        var enchantment = Enchantment.getByName(enchParts[0]);
                        var level = parseInt(enchParts[1]);
                        if (enchantment) meta.addEnchant(enchantment, level, true);
                    }
                }

                if (customModelData) meta.setCustomModelData(customModelData);
                item.setItemMeta(meta);
                return item;
            }

            var recipeId = args[0].trim();
            var action = args[1].trim().toUpperCase();
            var removeNamespace = args[2] === "null" ? Bukkit.getPluginManager().getPlugin("TriggerReactor") : Bukkit.getPluginManager().getPlugin(args[2]) ? Bukkit.getPluginManager().getPlugin(args[2]) : args[2];
            var addNamespace = args[3] === "null" ? Bukkit.getPluginManager().getPlugin("TriggerReactor") : Bukkit.getPluginManager().getPlugin(args[3]) ? Bukkit.getPluginManager().getPlugin(args[3]) : args[3];
            var shape = args[4].split(",");
            var resultItem = createItem(args[5]);
            var strict = args[6] === "true";
            var ingredients = args.slice(7);

            var removeKey = removeNamespace === "Minecraft" ? NamespacedKey.minecraft(recipeId) : removeNamespace === "All" ? null : new NamespacedKey(removeNamespace, recipeId);
            var addKey = addNamespace === "Minecraft" ? NamespacedKey.minecraft(recipeId) : new NamespacedKey(addNamespace, recipeId);
                        
            switch (action) {
                case "ADD":
                    if (Bukkit.getRecipe(addKey)) {
                        Bukkit.getLogger().warning("[CEActions] CHANGE_CRAFT ACTION: A recipe with id '" + recipeId + "' and namespace '" + addNamespace + "' already exists!");
                        return;
                    }
                    var recipe = new ShapedRecipe(addKey, resultItem);
                    recipe.shape(shape[0], shape[1], shape[2]);
                    
                    for (var i = 0; i < ingredients.length; i++) {
                        var parts = ingredients[i].split(",");
                        var symbol = parts[0].trim();
                        var item = createItem(parts[1]);
                        recipe.setIngredient(symbol.charAt(0), strict ? new RecipeChoice.ExactChoice(item) : item.getType());
                    }
                    Bukkit.addRecipe(recipe);
                    break;
                case "REMOVE":
                    if (removeKey) {
                        if (!Bukkit.getRecipe(removeKey)) {
                            Bukkit.getLogger().warning("[CEActions] CHANGE_CRAFT ACTION: A recipe with id '" + recipeId + "' and namespace '" + removeNamespace + "' does not exist!");
                            return;
                        }
                        Bukkit.removeRecipe(removeKey);
                    } else {
                        var recipes = Bukkit.recipeIterator();
                        while (recipes.hasNext()) {
                            var recipe = recipes.next();
                            if (recipe instanceof ShapedRecipe) {
                                var shapedRecipe = recipe;
                                if (shapedRecipe.getKey().getKey().equals(recipeId)) {
                                    recipes.remove();
                                }
                            }
                        }
                    }
                    break;
                case "CHANGE":
                    if (removeKey) {
                        if (!Bukkit.getRecipe(removeKey)) {
                            Bukkit.getLogger().warning("[CEActions] CHANGE_CRAFT ACTION: A recipe with id '" + recipeId + "' and namespace '" + removeNamespace + "' does not exist!");
                            return;
                        }
                        Bukkit.removeRecipe(removeKey);
                    } else {
                        var recipes = Bukkit.recipeIterator();
                        while (recipes.hasNext()) {
                            var recipe = recipes.next();
                            if (recipe instanceof ShapedRecipe) {
                                var shapedRecipe = recipe;
                                if (shapedRecipe.getKey().getKey().equals(recipeId)) {
                                    recipes.remove();
                                }
                            }
                        }
                    }
                    
                    if (Bukkit.getRecipe(addKey)) {
                        Bukkit.getLogger().warning("[CEActions] CHANGE_CRAFT ACTION: A recipe with id '" + recipeId + "' and namespace '" + addNamespace + "' already exists!");
                        return;
                    }
                    var newRecipe = new ShapedRecipe(addKey, resultItem);
                    newRecipe.shape(shape[0], shape[1], shape[2]);
                    
                    for (var i = 0; i < ingredients.length; i++) {
                        var parts = ingredients[i].split(",");
                        var symbol = parts[0].trim();
                        var item = createItem(parts[1]);
                        newRecipe.setIngredient(symbol.charAt(0), strict ? new RecipeChoice.ExactChoice(item) : item.getType());
                    }

                    Bukkit.addRecipe(newRecipe);
                    break;
                default:
                    Bukkit.getLogger().warning("[CEActions] CHANGE_CRAFT ACTION: Invalid action " + action);
            }
        }
    });

    var changeCraftInstance = new ChangeCraftAction("change_craft");
    
    return changeCraftInstance;
}

CEchangeCraft();