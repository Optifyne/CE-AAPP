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
var ConditionalEventsAction = Java.type("ce.ajneb97.api.ConditionalEventsAction");
var NamespacedKey = Java.type("org.bukkit.NamespacedKey");

function CEmanageRecipe() {
    var ManageRecipeAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine) {
            var args = actionLine.split(";");
            if (args.length < 4) {
                Bukkit.getLogger().warning("[CEActions] MANAGE_RECIPE ACTION: Invalid format! Correct format: manage_recipe: <player>;<recipe_id>;<namespace (can be “Minecraft” (built-in minecraft crafts) and any other plugins or your own made-up namespaces)>;<action (discover|forget)>");
                return;
            }

            var targetPlayer = Bukkit.getPlayer(args[0].trim());
            var recipeId = args[1].trim();
            var namespace = args[2].trim();
            var action = args[3].trim().toLowerCase();
            
            if (!targetPlayer) {
                Bukkit.getLogger().warning("[CEActions] MANAGE_RECIPE ACTION: Player '" + args[0].trim() + "' not found!");
                return;
            }

            var key = namespace === "Minecraft" ? NamespacedKey.minecraft(recipeId) : new NamespacedKey(Bukkit.getPluginManager().getPlugin(namespace) || namespace, recipeId);
            
            switch (action) {
                case "discover":
                    targetPlayer.discoverRecipe(key);
                    break;
                case "forget":
                    targetPlayer.undiscoverRecipe(key);
                    break;
                default:
                    Bukkit.getLogger().warning("[CEActions] MANAGE_RECIPE ACTION: Invalid action '" + action + "'! Use 'discover' or 'forget'.");
            }
        }
    });

    var manageRecipeInstance = new ManageRecipeAction("manage_recipe");
    
    return manageRecipeInstance;
}

CEmanageRecipe();
