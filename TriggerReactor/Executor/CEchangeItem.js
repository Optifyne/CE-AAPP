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
 *     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *     GNU General Public License for more details.
 *
 *     You should have received a copy of the GNU General Public License
 *     along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *******************************************************************************/

var Bukkit = Java.type("org.bukkit.Bukkit");
var ItemStack = Java.type("org.bukkit.inventory.ItemStack");
var Player = Java.type("org.bukkit.entity.Player");
var Material = Java.type("org.bukkit.Material");
var Block = Java.type("org.bukkit.block.Block");
var ItemMeta = Java.type("org.bukkit.inventory.meta.ItemMeta");
var Enchantment = Java.type("org.bukkit.enchantments.Enchantment");
var ItemFlag = Java.type("org.bukkit.inventory.ItemFlag");
var ConditionalEventsAction = Java.type("ce.ajneb97.api.ConditionalEventsAction");
var UUID = Java.type("java.util.UUID");
var EntityType = Java.type("org.bukkit.entity.EntityType");
var EquipmentSlot = Java.type("org.bukkit.inventory.EquipmentSlot");
var InventoryHolder = Java.type("org.bukkit.inventory.InventoryHolder");
var NamespacedKey = Java.type("org.bukkit.NamespacedKey");
var PersistentDataType = Java.type("org.bukkit.persistence.PersistentDataType");

var supportsNewMaxStackSize = false;

try {
    var version = Bukkit.getMinecraftVersion().split(".");
    var major = parseInt(version[0]);
    var minor = parseInt(version[1]);
    var patch = parseInt(version[2] || 0);
    if (major > 1 || (major === 1 && minor > 20) || (major === 1 && minor === 20 && patch >= 5)) {
        supportsNewMaxStackSize = true;
    }
} catch (e) {
    supportsNewMaxStackSize = false;
}

function CEchangeItem() {
    var ChangeItemAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine) {
            if (!actionLine || actionLine.trim() === "") {
                Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Invalid actionLine format! CORRECT FORMAT: change_item: target:<entity_uuid|player_name|world,x,y,z>;(optional) source:<entity_uuid|player_name|world,x,y,z>;source_slot:<slot (for source)>;(optional) switch:<true|false (for source and target)>;action:<action (may be set, remove or reset)>;material:<material (to change all items with the specified material)>;slot:<slot (to change an items by slots, may be several separated by comma, slots can be either name (for example: HAND, CHEST or FEET) or numeric, CURSOR slot is available to change an item at the cursor, but this requires the player to have any inventory open other than his personal inventory)>;(optional) newMaterial:<new_material (material to which you want to change current item)>;(optional) durability:<durability>;(optional) name:<name>;(optional) lore:<lore (in case of set: line1|line2|line3, in case of remove just numbers separated by commas, for example: 1,4,7)>;(optional) enchantments:<ENCHANTMENT_1=LEVEL,ENCHANTMENT_2=LEVEL>;(optional) flags:<flags (for example: HIDE_ENCHANTS)>;(optional) amount:<amount>;(optional) counts:<counts (in the case of specifying a material, indicates how many elements will be changed)>;(optional) customModelData:<customModelData>;(optional) dataContainer:<name>,<id>,<type (in case of set)>,<value (in case of set, for arrays wrap in [ ])>;(optional) opened_inventory:<true|false (whether to use the player's open inventory, such as a workbench or anvil, or his own)>;(optional) maxStack:<maxStack (below 1 and above 99, but values above 64 will not be displayed visually, only when setting amount; maxStack is only for Spigot 1.20.5+!)>");
                return;
            }

            var args = actionLine.split(";");
            var params = {};
            for (var i = 0; i < args.length; i++) {
                var param = args[i].trim().split(":");
                if (param.length == 2) {
                    params[param[0].trim()] = param[1].trim();
                } else {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Invalid parameter format at position " + (i + 1) + ": " + args[i]);
                    return;
                }
            }

            if (!params.source && !params.action) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Missing 'action' parameter!");
                return;
            }
            
            if (params.source && !params.target) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Missing 'target' parameter while 'source' is specified!");
                return;
            }
            
            if (params.source && !params.source_slot) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Missing 'source_slot' parameter while 'source' is specified!");
                return;
            }
            
            if (params.source && params.source_slot && !params.slot) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Missing 'slot' parameter while 'source_slot' is specified!");
                return;
            }
			
            var target = player;
            var source = null;
            var inventoryTarget = null;
            var inventorySource = null;
            
            function getTargetOrSource(object, sourceState) {
                if (object) {
                    if (object.length == 36) {
                        var uuid = UUID.fromString(object);
                        var worlds = Bukkit.getWorlds();
                        for (var i = 0; i < worlds.size(); i++) {
                            var world = worlds.get(i);
                            var entity = world.getEntity(uuid);
                            if (entity != null) {
                                if (!sourceState) target = entity;
                                else source = entity;
                                if (!sourceState) inventoryTarget = target.getEquipment();
                                else inventorySource = source.getEquipment();
                                break;
                            }
                        }
                        if (!target) {
                            Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Entity with UUID " + object + " not found!");
                            return;
                        }
                    } else {
                        var targetParts = object.split(",");
                        if (targetParts.length === 4) {
                            var worldName = targetParts[0].trim();
                            var x = parseInt(targetParts[1].trim());
                            var y = parseInt(targetParts[2].trim());
                            var z = parseInt(targetParts[3].trim());

                            var world = Bukkit.getWorld(worldName);
                            var block = world.getBlockAt(x, y, z);
                            var state = block.getState();

                            if (state instanceof InventoryHolder) {
                                if (!sourceState) target = state;
                                else source = state;
                                if (!sourceState) inventoryTarget = target.getInventory();
                                else inventorySource = source.getInventory();
                            } else {
                                Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Target coordinates do not point to a valid storage (InventoryHolder)!");
                                return;
                            }
                        } else {
                            var onlinePlayer = Bukkit.getPlayer(object);
                            if (onlinePlayer) {
                                if (!sourceState) target = onlinePlayer;
                                else source = onlinePlayer;
                                if (!sourceState) inventoryTarget = params.opened_inventory && params.opened_inventory === "true" ? target.getOpenInventory().getTopInventory() : target.getInventory();
                                else inventorySource = params.opened_inventory && params.opened_inventory === "true" ? source.getOpenInventory().getTopInventory() : source.getInventory();
                            } else {
                                Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Player " + object + " not found!");
                                return;
                            }
                        }
                    }
                }
            }
            
            if (params.target) getTargetOrSource(params.target, false);
            if (params.source) getTargetOrSource(params.source, true);
            else if (!params.target && !params.source) getTargetOrSource(target, false);

            if (!inventoryTarget) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Target does not have an inventory or equipment!");
                return;
            }
            if (params.source && !inventorySource) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Source does not have an inventory or equipment!");
                return;
            }
            
            var targetSlot = null;
                                    
            function checkSlots(object, sourceState) {
                if (object) {
                    var slotParts = object.split(",").map(function(s) { return s.trim(); });

                    if (!sourceState) {
                        if (inventoryTarget.getSize) {
                            slotParts.forEach(function(slot) {
                                var slotIndex = slot === "CURSOR" ? "CURSOR" : slot === "0" ? 0 : parseInt(slot) ? parseInt(slot) : EquipmentSlot[slot.toUpperCase()];
                                if (((!isNaN(slotIndex) && slotIndex >= 0 && slotIndex < inventoryTarget.getSize()) || (isNaN(slotIndex) && slotIndex))) {
                                    targetSlot = slotIndex;
                                    var cursor = slotIndex === "CURSOR";
                                    var item = cursor ? target.getItemOnCursor() : inventoryTarget.getItem(slotIndex);
                                    applyMetaChange(target, inventoryTarget, slotIndex, item, params, replacedCount, cursor);
                                } else {
                                    Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Invalid target slot number " + slot);
                                    return;
                                }
                            });
                        } else {
                            slotParts.forEach(function(slot) {
                                var equipmentSlot = EquipmentSlot[slot.toUpperCase()];
                                if (!equipmentSlot) {
                                    Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Invalid target equipment slot " + slot);
                                    return;
                                }
                                targetSlot = equipmentSlot;
                                var item = inventoryTarget.getItem(equipmentSlot);
                                applyMetaChange(target, inventoryTarget, equipmentSlot, item, params, replacedCount, false);
                            });
                        }
                    } else {
                        if (inventorySource.getSize) {
                            slotParts.forEach(function(slot) {
                                var slotIndex = slot === "CURSOR" ? "CURSOR" : slot === "0" ? 0 : parseInt(slot) ? parseInt(slot) : EquipmentSlot[slot.toUpperCase()];
                                if (((!isNaN(slotIndex) && slotIndex >= 0 && slotIndex < inventoryTarget.getSize()) || (isNaN(slotIndex) && slotIndex))) {
                                    if (!params.switch || (params.switch && params.switch === "false")) {
                                        var item = null;
                                        var cursorSource = slotIndex === "CURSOR" && source.getItemOnCursor;
                                        var cursorTarget = targetSlot === "CURSOR" && target.getItemOnCursor;
                                        if (cursorSource) {
                                            item = source.getItemOnCursor() ? source.getItemOnCursor() : new ItemStack(Material.AIR, 1);
                                        } else {
                                            item = inventorySource.getItem(slotIndex) ? inventorySource.getItem(slotIndex) : new ItemStack(Material.AIR, 1);
                                        }
                                        cursorTarget ? target.setItemOnCursor(item.clone()) : inventoryTarget.setItem(targetSlot, item.clone());
                                    } else {
                                        var item1 = null;
                                        var item2 = null;
                                        var cursorSource = slotIndex === "CURSOR" && source.getItemOnCursor;
                                        var cursorTarget = targetSlot === "CURSOR" && target.getItemOnCursor;
                                        if (cursorSource) {
                                            item1 = source.getItemOnCursor() ? source.getItemOnCursor() : new ItemStack(Material.AIR, 1);
                                        } else {
                                            item1 = inventorySource.getItem(slotIndex) ? inventorySource.getItem(slotIndex) : new ItemStack(Material.AIR, 1);
                                        }
                                        if (cursorTarget) {
                                            item2 = target.getItemOnCursor() ? target.getItemOnCursor() : new ItemStack(Material.AIR, 1);
                                        	target.setItemOnCursor(item1.clone());
                                        } else {
                                            item2 = inventoryTarget.getItem(targetSlot) ? inventoryTarget.getItem(targetSlot) : new ItemStack(Material.AIR, 1);
                                        	inventoryTarget.setItem(targetSlot, item1.clone());
                                        }
										cursorSource ? source.setItemOnCursor(item2.clone()) : inventorySource.setItem(slotIndex, item2.clone());
                                    }
                                } else {
                                    Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Invalid source slot number " + slot);
                                }
                            });
                        } else {
                            slotParts.forEach(function(slot) {
                                var equipmentSlot = EquipmentSlot[slot.toUpperCase()];
                                if (!equipmentSlot) {
                                    Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Invalid source equipment slot " + slot);
                                    return;
                                } else {
                                    if (!params.switch || (params.switch && params.switch === "false")) {
                                        var item = inventorySource.getItem(equipmentSlot) ? inventorySource.getItem(equipmentSlot) : new ItemStack(Material.AIR, 1);
                                        inventoryTarget.setItem(targetSlot, item.clone());
                                    } else {
                                        var item1 = inventorySource.getItem(equipmentSlot) ? inventorySource.getItem(equipmentSlot) : new ItemStack(Material.AIR, 1);
                                        var item2 = inventoryTarget.getItem(targetSlot) ? inventoryTarget.getItem(targetSlot) : new ItemStack(Material.AIR, 1);
                                        inventoryTarget.setItem(targetSlot, item1.clone());
                                        inventorySource.setItem(equipmentSlot, item2.clone());
                                    }
                                }
                            });
                        }
                    }
                }
            }
            
            if (!params.slot && !params.material) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: No material or slot specified!");
            }
            
            if (params.slot) checkSlots(params.slot, false);
            if (params.source_slot) checkSlots(params.source_slot, true);
            
			var replacedCount = { count: 0 };
            
            if (params.material) {
                var material = Material.matchMaterial(params.material);
                if (material == null) {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Unknown material " + params.material);
                    return;
                }

                if (inventoryTarget.getSize) {
                    var count = params.counts ? parseInt(params.counts) : inventoryTarget.getSize();
                    for (var i = 0; i < inventoryTarget.getSize(); i++) {
                        var item = inventoryTarget.getItem(i);
                        if (item != null && item.getType() == material) {
                            applyMetaChange(target, inventoryTarget, i, item, params, replacedCount, false);
                            replacedCount.count++;
                            if (replacedCount.count >= count) {
                                break;
                            }
                        } else if (item == null && material == Material.AIR) {
                            applyMetaChange(target, inventoryTarget, i, item, params, replacedCount, false);
                            replacedCount.count++;
                            if (replacedCount.count >= count) {
                                break;
                            }
                        }
                    }
                } else {
                    var count = params.counts ? parseInt(params.counts) : 6;
                    var slots = [
                        EquipmentSlot.HEAD,
                        EquipmentSlot.CHEST,
                        EquipmentSlot.LEGS,
                        EquipmentSlot.FEET,
                        EquipmentSlot.HAND,
                        EquipmentSlot.OFF_HAND
                    ];

                    for (var i = 0; i < slots.length; i++) {
                        var slot = slots[i];
                        var item = inventoryTarget.getItem(slot);
                        if (item != null && item.getType() == material) {
                            applyMetaChange(target, inventoryTarget, slots[i], item, params, replacedCount, false);
                            replacedCount.count++;
                            if (replacedCount.count >= count) {
                                break;
                            }
                        }
                    }
                }
            }
		}
    });
    
    function applyMetaChange(entity, inventory, slot, item, params, replacedCount, cursor) {
        if (params.action == "set" && params.newMaterial) {
            var newMaterial = Material.matchMaterial(params.newMaterial);
            if (newMaterial != null) {
                if (newMaterial != Material.AIR) {
                    if (item != null && item.getType() != Material.AIR) {
                        item.setType(newMaterial);
                    } else {
                        var newItem = new ItemStack(Material.valueOf(newMaterial), 1);
                        cursor ? entity.setItemOnCursor(newItem) : inventory.setItem(slot, newItem);
						item = inventory.getItem(slot);
                    }
                } else {
                    if (item != null && item.getType() != Material.AIR) {
                        var newItem = new ItemStack(Material.valueOf(newMaterial), 1);
                        cursor ? entity.setItemOnCursor(newItem) : inventory.setItem(slot, newItem);
                    } else {
                        replacedCount.count--;
                    }
                }
            } else {
                replacedCount.count--;
                Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Invalid new material specified.");
            }
        }

        if (item != null && item.getType() != Material.AIR) {
            var meta = item.getItemMeta();
            if (meta == null) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Item does not have meta data!");
                return;
            }

            if (params.action == "set" && params.durability) {
                var durability = parseInt(params.durability);
                if (durability < 0) {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Durability cannot be negative!");
                    return;
                }
                meta.setDamage(item.getType().getMaxDurability() - durability);
            } else if (params.action == "reset" && params.durability) {
                meta.setDamage(0);
            }

            if (params.action == "set" && params.lore) {
                var loreEntries = params.lore.split("|");
                var currentLore = meta.hasLore() ? meta.getLore().toArray() : [];
                var loreList = Java.from(currentLore);
                var line = 0;
                loreEntries.forEach(function(entry) {
                    var lineText = entry.trim();
                    if (lineText === "") {
                        line++;
                        return;
                    }
                    while (loreList.length <= line) {
                        loreList.push("");
                    }
                    loreList[line] = lineText;
                    line++;
                });
                meta.setLore(java.util.Arrays.asList(loreList));
            } else if (params.action == "remove" && params.lore) {
                var loreEntries = params.lore.split(",");
                var loreList = meta.getLore();
                if (loreList != null) {
                    loreEntries.map(function(entry) {
                        return parseInt(entry);
                    }).sort(function(a, b) {
                        return b - a;
                    }).forEach(function(lineNumber) {
                        if (lineNumber >= 0 && lineNumber < loreList.size()) {
                            loreList.remove(lineNumber);
                        }
                    });
                    meta.setLore(loreList);
                }
            } else if (params.action == "reset" && params.lore) {
                meta.setLore(java.util.Arrays.asList([]));
            }

            if (params.action == "set" && params.name) {
                meta.setDisplayName(params.name);
            } else if (params.action == "remove" && params.name) {
                meta.setDisplayName(" ");
            } else if (params.action == "reset" && params.name) {
                meta.setDisplayName(null);
            }

            if (params.action == "set" && params.enchantments) {
                var enchantmentArgs = params.enchantments.split(",");
                enchantmentArgs.forEach(function (enchantmentStr) {
                    var parts = enchantmentStr.split("=");
                    var enchantmentName = parts[0].trim();
                    var enchantmentLevel = parseInt(parts[1].trim());
                    var enchantment = Enchantment.getByName(enchantmentName.toUpperCase());
                    if (enchantment != null) {
                        meta.addEnchant(enchantment, enchantmentLevel, true);
                    } else {
                        Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Unknown enchantment " + enchantmentName + " (is this what enchantment is called on your server version?)");
                    }
                });
            } else if (params.action == "remove" && params.enchantments) {
                var enchantmentArgs = params.enchantments.split(",");
                enchantmentArgs.forEach(function (enchantmentStr) {
                    var enchantmentName = enchantmentStr.split("=")[0].trim();
                    var enchantment = Enchantment.getByName(enchantmentName.toUpperCase());

                    if (enchantment != null) {
                        meta.removeEnchant(enchantment);
                    } else {
                        Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Unknown enchantment " + enchantmentName + " (is this what enchantment is called on your server version?)");
                    }
                });
            } else if (params.action == "reset" && params.enchantments) {
                meta.getEnchants().keySet().forEach(function(enchantment) {
                    meta.removeEnchant(enchantment);
                });
            }

            if (params.action == "set" && params.flags) {
                var flags = params.flags.split(",");
                flags.forEach(function (flagStr) {
                    var flag = flagStr.trim().toUpperCase();
                    try {
                        var itemFlag = ItemFlag.valueOf(flag);
                        meta.addItemFlags([itemFlag]);
                    } catch (e) {
                        Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Unknown flag " + flag);
                    }
                });
            } else if (params.action == "remove" && params.flags) {
                var flags = params.flags.split(",");
                flags.forEach(function (flagStr) {
                    var flag = flagStr.trim().toUpperCase();
                    try {
                        var itemFlag = ItemFlag.valueOf(flag);
                        meta.removeItemFlags([itemFlag]);
                    } catch (e) {
                        Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Unknown flag " + flag);
                    }
                });
            } else if (params.action == "reset" && params.flags) {
                meta.removeItemFlags(ItemFlag.values());
            }

            if (params.action == "set" && params.amount) {
                var amount = parseInt(params.amount);
                item.setAmount(amount);
            }
            
            if (params.action == "set" && params.customModelData) {
                var data = parseInt(params.customModelData);
                meta.setCustomModelData(data);
            } else if (params.action == "remove" && params.customModelData) {
                meta.setCustomModelData(0);
            } else if (params.action == "reset" && params.customModelData) {
                meta.setCustomModelData(null);
            }
            
            function getPersistentDataType(typeName) {
				var types = {
                    "STRING": PersistentDataType.STRING,
                    "INTEGER": PersistentDataType.INTEGER,
                    "FLOAT": PersistentDataType.FLOAT,
                    "DOUBLE": PersistentDataType.DOUBLE,
                    "LONG": PersistentDataType.LONG,
                    "BYTE": PersistentDataType.BYTE,
                    "SHORT": PersistentDataType.SHORT,
                    "BOOLEAN": PersistentDataType.BOOLEAN,
                    "BYTE_ARRAY": PersistentDataType.BYTE_ARRAY,
                    "INTEGER_ARRAY": PersistentDataType.INTEGER_ARRAY,
                    "LONG_ARRAY": PersistentDataType.LONG_ARRAY
				};
				
				return types[typeName.toUpperCase()] || null;
			}
            
            function parseValue(type, value) {
                if (value.startsWith("[") && value.endsWith("]")) {
                    var rawValues = value.substring(1, value.length - 1).split(",").map(function (v) { return v.trim(); });

                    switch (type) {
                        case "INTEGER_ARRAY": {
                            var intArray = Java.to(rawValues.map(function(v) { return java.lang.Integer.parseInt(v); }), "int[]");
                            return intArray;
                        }
                        case "LONG_ARRAY": {
                            var longArray = Java.to(rawValues.map(function(v) { return java.lang.Long.parseLong(v); }), "long[]");
                            return longArray;
                        }
                        case "BYTE_ARRAY": {
                            var byteArray = Java.to(rawValues.map(function(v) { return java.lang.Byte.parseByte(v); }), "byte[]");
                            return byteArray;
                        }
                        default:
                            return rawValues;
                    }
                } else {
                    switch (type) {
                        case "BOOLEAN":
                            return value.toLowerCase() === "true";
                        case "BYTE":
                            return java.lang.Byte.parseByte(value);
                        case "DOUBLE":
                            return java.lang.Double.parseDouble(value);
                        case "FLOAT":
                            return java.lang.Float.parseFloat(value);
                        case "INTEGER":
                            return java.lang.Integer.parseInt(value);
                        case "LONG":
                            return java.lang.Long.parseLong(value);
                        case "SHORT":
                            return java.lang.Short.parseShort(value);
                        case "STRING":
                            return value;
                        default:
                            return value;
                    }
                }
            }
            
            if (params.action == "set" && params.dataContainer) {
                var meta = item.getItemMeta();
                var data = meta.getPersistentDataContainer();

                var firstThreeParts = params.dataContainer.split(",", 3);
                var valuePart = params.dataContainer.substring(firstThreeParts.join(",").length + 1);

                try {
                    var name = firstThreeParts[0];
                    var id = firstThreeParts[1];
                    var type = firstThreeParts[2];
                    var value = parseValue(type, valuePart);

                    var key = new NamespacedKey(name, id);
                    data.set(key, getPersistentDataType(type), value);
                } catch (e) {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Invalid dataContainer " + params.dataContainer);
                }
            } else if (params.action == "remove" && params.dataContainer) {
                var meta = item.getItemMeta();
                var data = meta.getPersistentDataContainer();
                var parts = params.dataContainer.split(",");
                try {
                    var name = parts[0];
                    var id = parts[1];

                    var key = new NamespacedKey(name, id);
                    data.remove(key);
                } catch (e) {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Invalid dataContainer " + params.dataContainer);
                }
            } else if (params.action == "reset" && params.dataContainer) {
                var meta = item.getItemMeta();
                var data = meta.getPersistentDataContainer();
                try {
                    var keys = data.getKeys();
                    keys.forEach(function (key) {
                        data.remove(key);
                    });
                } catch (e) {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Invalid dataContainer " + params.dataContainer);
                }
            }
            
            if (params.action == "set" && params.maxStack) {
                if (!supportsNewMaxStackSize) {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: MaxStack option is only available on Spigot 1.20.5+!");
                    return;
                }
                var stack = parseInt(params.maxStack);
                meta.setMaxStackSize(stack);
            } else if (params.action == "reset" && params.maxStack) {
                if (!supportsNewMaxStackSize) {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: MaxStack option is only available on Spigot 1.20.5+!");
                    return;
                }
                meta.setMaxStackSize(item.getType().getMaxStackSize());
            }

            item.setItemMeta(meta);

            if (!(entity instanceof Player) && newMaterial != Material.AIR) inventory.setItem(slot, item);
        }
    }

    var changeItemInstance = new ChangeItemAction("change_item");
    
    return changeItemInstance;
}

CEchangeItem();