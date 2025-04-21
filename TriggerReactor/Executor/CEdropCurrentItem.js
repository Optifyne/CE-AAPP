/*******************************************************************************
 *     Copyright (c) 2023 TriggerReactor Team
 *
 *     This program is free software: you can redistribute it and/or modify
 *     it under the terms of the GNU General Public License as published by
 *     the Free Software Foundation, either version 3 of the License, or
 *     (at your option) any later version.
 *
 *     This program is distributed in the hope that it will be useful,
 *     but WITHOUT ANY WARRANTY; without even the implied warranty as to
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *******************************************************************************/

var Bukkit = Java.type("org.bukkit.Bukkit");
var ConditionalEventsAction = Java.type("ce.ajneb97.api.ConditionalEventsAction");
var EquipmentSlot = Java.type("org.bukkit.inventory.EquipmentSlot");
var ItemStack = Java.type("org.bukkit.inventory.ItemStack");
var Material = Java.type("org.bukkit.Material");

var isSuitableCore = false;
var supportsNewDropItem = false;

try {
    var version = Bukkit.getVersion();
    isSuitableCore = !version.contains("Spigot") && !version.contains("Bukkit");
    if (isSuitableCore) {
        var paperVersion = Bukkit.getMinecraftVersion().split(".");
        var major = parseInt(paperVersion[0]);
        var minor = parseInt(paperVersion[1]);
        var patch = parseInt(paperVersion[2] || 0);
        if (major > 1 || (major === 1 && minor > 21) || (major === 1 && minor === 21 && patch >= 4)) {
            supportsNewDropItem = true;
        }
    }
} catch (e) {
    supportsNewDropItem = false;
}

function CEdropCurrentItem() {
    var DropCurrentItemAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine) {
            var args = actionLine.split(";");
            if ((supportsNewDropItem && args.length < 2) || (!supportsNewDropItem && args.length != 2)) {
                Bukkit.getLogger().warning("[CEActions] DROP_CURRENT_ITEM ACTION: Invalid actionLine format! " +
                    (supportsNewDropItem ? "CORRECT FORMAT: drop_current_item: <player>;<drop_all (true|false) or slot|material (slots may be HEAD, CHEST, LEGS, FEET, OFF_HAND, HAND and all possible number slots)>;(optional in case of slot, mandatory in case of material) <amount>;(optional, will work only if amount is specified) <throwRandomly (true|false)>" : "drop_current_item: <player>;<drop_all (true|false)>")
                );
                return;
            }

            var targetIdentifier = args[0].trim();
            var target = Bukkit.getPlayer(targetIdentifier);
            if (target == null) {
                Bukkit.getLogger().warning("[CEActions] DROP_CURRENT_ITEM ACTION: Target player not found: " + targetIdentifier);
                return;
            }

            if (supportsNewDropItem) {
                var secondArg = args[1].trim();
                var amount = args[2] ? parseInt(args[2].trim()) : null;
                var throwRandomly = args[3] ? args[3].trim().toLowerCase() === "true" : false;
                
                if (Material.matchMaterial(secondArg) && !amount) {
                    Bukkit.getLogger().warning("[CEActions] DROP_CURRENT_ITEM ACTION: You need to specify the amount.");
                    return;
                }
                                
                var material = Material.matchMaterial(secondArg);
                if (material != null) {
                    var item = new ItemStack(material, amount);
                    target.dropItem(item, throwRandomly, null);
                } else if (!isNaN(parseInt(secondArg))) {
                    var slot = parseInt(secondArg);
                    amount ? target.dropItem(slot, amount, throwRandomly, null) : target.dropItem(slot);
                } else if (secondArg === "true" || secondArg === "false") {
                    var dropAll = args[1].trim().toLowerCase() === "true";
                	target.dropItem(dropAll);
                } else {
try {
                        var slot = EquipmentSlot.valueOf(secondArg.toUpperCase());
                        amount ? target.dropItem(slot, amount, throwRandomly, null) : target.dropItem(slot);
                    } catch (e) {
                        Bukkit.getLogger().warning("[CEActions] DROP_CURRENT_ITEM ACTION: EquipmentSlot is not valid.");
                        return;
                    }
                }
            } else {
                var dropAll = args[1].trim().toLowerCase() === "true";
                target.dropItem(dropAll);
            }
        }
    });

    var dropCurrentItemInstance = new DropCurrentItemAction("drop_current_item");
    return dropCurrentItemInstance;
}

CEdropCurrentItem();