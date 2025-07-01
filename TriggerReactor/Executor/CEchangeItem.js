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
var HumanEntity = Java.type("org.bukkit.entity.HumanEntity");
var NamespacedKey = Java.type("org.bukkit.NamespacedKey");
var PersistentDataType = Java.type("org.bukkit.persistence.PersistentDataType");
var EnchantmentStorageMeta = Java.type("org.bukkit.inventory.meta.EnchantmentStorageMeta");

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
        execute: function(player, actionLine, minecraftEvent) {
            if (!actionLine || actionLine.trim() === "") {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Invalid actionLine format! CORRECT FORMAT: change_item: target:<entity_uuid|player_name|world,x,y,z>;(optional) source:<entity_uuid|player_name|world,x,y,z>;source_slot:<slot (for source slot, may be only one, you also can specify like OPENED|<slot> and EC|<slot> to obtain the slot in the player’s open inventory or enderchest, or CURSOR to obtain an item at the cursor)>;(optional) switch:<true|false (for source and target)>;action:<action (may be set, remove, reset, increase, decrease, multiply or divide, but not all options support all actions)>;material:<material (to change all items with the specified material, may be several separated by comma, you also can specify like OPENED|<material> and EC|<material> to obtain the material in the player’s open inventory or enderchest)>;slot:<slot (to change an items by slots, may be several separated by comma, slots can be either name (for example: HAND, CHEST or FEET) or numeric, CURSOR slot is available to change an item at the cursor, also you can specify like OPENED|<slot> and EC|<slot> to obtain the slot in the player’s open inventory or enderchest)>;(optional) newMaterial:<new_material (material to which you want to change current item)>;(optional) durability:<durability>;(optional) name:<name>;(optional) lore:<lore (in case of set: line1|line2|line3, in case of remove just numbers separated by commas, for example: 1,4,7)>;(optional) enchantments:<ENCHANTMENT_1=LEVEL,ENCHANTMENT_2=LEVEL>;(optional) enchantmentsBook:<ENCHANTMENT_1=LEVEL,ENCHANTMENT_2=LEVEL>;(optional) flags:<flags (for example: HIDE_ENCHANTS)>;(optional) amount:<amount>;(optional) counts:<counts (indicates how many elements will be changed)>;(optional) customModelData:<customModelData>;(optional) dataContainer:<name>,<id>,<type (in case of set)>,<value (in case of set, for arrays wrap in [ ])>;(optional) maxStack:<maxStack (above 1 and below 99, but values above 64 will not be displayed visually, only when setting amount; maxStack is only for Spigot 1.20.5+!)>;(optional) order:<order (to specify the order of the “source”, “slot” and “material” parameters execution through the comma)>;(optional) overrideOrderCountsOverGlobalCounts:<true|false (if you want local order parameters, if specified, to take precedence over the global one)>;(optional) cooldown:<ticks (to change the current cooldown of the item)>;(optional) cooldownBasic:<seconds (to change the basic cooldown of the item, float values may be too)>");
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
            
            if (!params.target) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Missing 'target' parameter!");
                return;
            }
            
            if (params.source && !params.source_slot) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Missing 'source_slot' parameter while 'source' is specified!");
                return;
            }
            
            if (!params.slot && !params.material) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: No material or slot specified!");
                return;
            }
			
            var target = null;
            var source = null;
            var inventoryTarget = null;
            var inventorySource = null;
            
            function getTargetOrSource(object, sourceState) {
                if (object) {
                    if (object.length === 36) {
                        try {
                        	var entity = Bukkit.getEntity(UUID.fromString(object));
                            if (!sourceState) target = entity;
                            else source = entity;
                            if (!sourceState) inventoryTarget = target.getInventory ? target.getInventory() : target.getEquipment();
                            else inventorySource = source.getInventory ? source.getInventory() : source.getEquipment();
                        } catch (e) {
                            Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Valid entity with UUID " + object + " not found!");
                            return;
                        }
                    } else {
                        var targetParts = object.split(",");
                        if (targetParts.length === 4) {
                            try {
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
                                    Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Coordinates do not point to a valid storage (InventoryHolder)!");
                                    return;
                                }
                            } catch (e) {
                                Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Coordinates are invalid!");
                                return;
                            }
                        } else {
                            var onlinePlayer = Bukkit.getPlayer(object);
                            if (onlinePlayer) {
                                if (!sourceState) target = onlinePlayer;
                                else source = onlinePlayer;
                                if (!sourceState) inventoryTarget = target.getInventory();
                                else inventorySource = source.getInventory();
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

            if (!inventoryTarget) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Target does not have an inventory or equipment!");
                return;
            }
            if (params.source && !inventorySource) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Source does not have an inventory or equipment!");
                return;
            }

            var inventoryTargetSaved = inventoryTarget;
            var replacedCount = { count: 0 };
			var counts = {
                "material": 0,
                "source": {
                    "general": 0,
                    "material": 0,
                    "slot": 0
                },
                "slot": 0
            };
            var sourceMaterial = null;
            var newMaterialGlobal = null;
            var cdMat = null;
            var cdMatCur = null;
            
            function randomDigitString(n) {
                var result = "";
                for (var i = 0; i < n; i++) {
                    result += Math.floor(Math.random() * 10);
                }
                return result;
            }
            
            function checkNesting(options, key, value) {
                for (var k in options) {
                  if (options[k][key] === value) return true;
                }
                return false;
            }
            
            function processTargets(state, ifSlot, ifMaterial, slotFurtherMaterial, options, amount) {
                switch (state) {
                    case "source":
                        var rawSourceSlot = params.source_slot.toUpperCase().split("|");
                        var sourceSlotExact = null;
                        if (rawSourceSlot.length === 1) sourceSlotExact = rawSourceSlot[0];
                        else if (rawSourceSlot.length === 2 && rawSourceSlot[0] === "OPENED") {
                            sourceSlotExact = rawSourceSlot[1];
                            if (source instanceof HumanEntity) inventorySource = source.getOpenInventory().getTopInventory();
                        }
                        else if (rawSourceSlot.length === 2 && rawSourceSlot[0] === "EC") {
                            sourceSlotExact = rawSourceSlot[1];
                            if (source instanceof HumanEntity) inventorySource = source.getEnderChest();
                        }
                        
                        var sourceSlotIndex = null;
                        if (inventorySource.getSize) {
                        	try {
                            	sourceSlotIndex = EquipmentSlot.valueOf(sourceSlotExact);
                            } catch (e) {
                                sourceSlotIndex = !isNaN(sourceSlotExact) ? parseInt(sourceSlotExact) : sourceSlotExact === "CURSOR" && source instanceof HumanEntity ? "CURSOR" : undefined;
                            }
                            
                            if ((!isNaN(sourceSlotIndex) && (sourceSlotIndex < 0 || sourceSlotIndex >= inventorySource.getSize())) || (isNaN(sourceSlotIndex) && !sourceSlotIndex)) {
                                Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Invalid source slot " + sourceSlotExact);
                                return;
                            }
                        } else {
                        	try {
                                sourceSlotIndex = EquipmentSlot.valueOf(sourceSlotExact);
                            } catch (e) {
                                Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Invalid source equipment slot " + sourceSlotExact);
                                return;
                            }
                                    
                            if (isNaN(sourceSlotIndex) && !sourceSlotIndex) {
                                Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Invalid source equipment slot " + sourceSlotExact);
                                return;
                            }
                        }
                        
                        var cursorSource = sourceSlotIndex === "CURSOR" && source.getItemOnCursor;

                        function slot() {
                            if (ifSlot) {
                                var sourceItem = null;
                                
                                if (cursorSource) {
                                    sourceItem = source.getItemOnCursor() ? source.getItemOnCursor() : new ItemStack(Material.AIR, 1);
                                } else {
                                    sourceItem = inventorySource.getItem(sourceSlotIndex) ? inventorySource.getItem(sourceSlotIndex) : new ItemStack(Material.AIR, 1);
                                }
                                if (options.material && checkNesting(options.material, "useSourceMaterialIfFurther", "true")) sourceMaterial = sourceItem.getType().toString();
                                
                                if (params.slot) {
                                    var slotsData = params.slot.split(",").map(function(s) { return s.trim(); });
                                    var lastNewItem = null;

                                    slotsData.every(function(slot) {
                                        inventoryTarget = inventoryTargetSaved;

                                        var rawTargetSlot = slot.toUpperCase().split("|");
                                        var targetSlotExact = null;
                                        if (rawTargetSlot.length === 1) targetSlotExact = rawTargetSlot[0];
                                        else if (rawTargetSlot.length === 2 && rawTargetSlot[0] === "OPENED") {
                                            targetSlotExact = rawTargetSlot[1];
                                            if (target instanceof HumanEntity) inventoryTarget = target.getOpenInventory().getTopInventory();
                                        }
                                        else if (rawTargetSlot.length === 2 && rawTargetSlot[0] === "EC") {
                                            targetSlotExact = rawTargetSlot[1];
                                            if (target instanceof HumanEntity) inventoryTarget = target.getEnderChest();
                                        }

                                        var targetSlotIndex = null;
                                        if (inventoryTarget.getSize) {
                                            try {
                                                targetSlotIndex = EquipmentSlot.valueOf(targetSlotExact);
                                            } catch (e) {
                                                targetSlotIndex = !isNaN(targetSlotExact) ? parseInt(targetSlotExact) : targetSlotExact === "CURSOR" && target instanceof HumanEntity ? "CURSOR" : undefined;
                                            }

                                            if ((!isNaN(targetSlotIndex) && (targetSlotIndex < 0 || targetSlotIndex >= inventoryTarget.getSize())) || (isNaN(targetSlotIndex) && !targetSlotIndex)) {
                                                Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Invalid target slot " + targetSlotExact);
                                                return true;
                                            }
                                        } else {
                                            try {
                                                targetSlotIndex = EquipmentSlot.valueOf(targetSlotExact);
                                            } catch (e) {
                                                Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Invalid target equipment slot " + targetSlotExact);
                                                return true;
                                            }

                                            if (isNaN(targetSlotIndex) && !targetSlotIndex) {
                                                Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Invalid target equipment slot " + targetSlotExact);
                                                return true;
                                            }
                                        }
                                        
                                        function counting() {
                                            function localCounts() {
                                                if (options.source[amount.source].overridePartialCountsOverGeneralCounts === "true") {
                                                    if (options.source[amount.source].slot.counts > -1 && counts.source.slot >= options.source[amount.source].slot.counts) return false;
                                                    if (options.source[amount.source].counts > -1 && options.source[amount.source].slot.counts === -1 && counts.source.general >= options.source[amount.source].counts) return false;
                                                } else {
                                                    if (options.source[amount.source].counts > -1 && counts.source.general >= options.source[amount.source].counts) return false;
                                                    if (options.source[amount.source].slot.counts > -1 && options.source[amount.source].counts === -1 && counts.source.slot >= options.source[amount.source].slot.counts) return false;
                                                }
                                                return true;
                                            }
                                            
                                            if (params.counts && params.overrideOrderCountsOverGlobalCounts === "true") {
                                                if (options.source[amount.source].slot.counts > -1 || options.source[amount.source].counts > -1) {
                                                    if (!localCounts()) return false;
                                                } else {
                                                    if (replacedCount.count >= params.counts) return false;
                                                }
                                            } else if (params.counts) {
                                                if (replacedCount.count >= params.counts) return false;
                                            } else {
                                                if (!localCounts()) return false;
                                            }

                                            if (params.counts) replacedCount.count++;
                                            if (options.source[amount.source].counts > -1) counts.source.general++;
                                            if (options.source[amount.source].slot.counts > -1) counts.source.slot++;
                                            return true;
                                        }
                                        
                                        var cursorTarget = targetSlotIndex === "CURSOR" && target.getItemOnCursor;

                                        if (!params.switch || (params.switch && params.switch === "false")) {
                                            if (!counting()) return false;
                                            cursorTarget ? target.setItemOnCursor(sourceItem.clone()) : inventoryTarget.setItem(targetSlotIndex, sourceItem.clone());
                                        } else {
                                            if (!counting()) return false;
                                            var newItem = null;

                                            if (cursorTarget) {
                                                newItem = target.getItemOnCursor() ? target.getItemOnCursor() : new ItemStack(Material.AIR, 1);
                                                target.setItemOnCursor(sourceItem.clone());
                                            } else {
                                                newItem = inventoryTarget.getItem(targetSlotIndex) ? inventoryTarget.getItem(targetSlotIndex) : new ItemStack(Material.AIR, 1);
                                                inventoryTarget.setItem(targetSlotIndex, sourceItem.clone());
                                            }

                                            if (newItem) lastNewItem = newItem;
                                        }
                                                                                
                                        return true;
                                    });

                                    if (lastNewItem) cursorSource ? source.setItemOnCursor(lastNewItem.clone()) : inventorySource.setItem(sourceSlotIndex, lastNewItem.clone());
                                }
                            }
                        }
                                      
                        function material() {
                            if (ifMaterial) {
								var sourceItem = null;
                                
                                if (cursorSource) {
                                    sourceItem = source.getItemOnCursor() ? source.getItemOnCursor() : new ItemStack(Material.AIR, 1);
                                } else {
                                    sourceItem = inventorySource.getItem(sourceSlotIndex) ? inventorySource.getItem(sourceSlotIndex) : new ItemStack(Material.AIR, 1);
                                }
                                if (options.material[amount.material] && options.material[amount.material].useSourceMaterialIfFurther === "true") sourceMaterial = sourceItem.getType().toString();
								
                                if (params.material) {
                                	var rawMaterialsData = params.material.toUpperCase().split(",").map(function(s) { return s.trim(); });
                        			var materialsData = newMaterialGlobal && options.source[amount.source] && options.source[amount.source].useNewMaterialIfFurther === "true" ? [newMaterialGlobal] : rawMaterialsData;
                                    if (newMaterialGlobal) {
                                        rawMaterialsData.every(function(m) {
                                            if ((m.split("|")[0] === "OPENED" && options.source[amount.source] && options.source[amount.source].applyOpenedToNewMaterial === "ifExists") || (options.source[amount.source] && options.source[amount.source].applyOpenedToNewMaterial === "anyway")) {
                                                materialsData.push("OPENED|" + newMaterialGlobal);
                                                return false;
                                            }
                                            return true;
                                        });
                                    }
                                    
                                    var equipmentSlots = [
                                        EquipmentSlot.HEAD,
                                        EquipmentSlot.CHEST,
                                        EquipmentSlot.LEGS,
                                        EquipmentSlot.FEET,
                                        EquipmentSlot.HAND,
                                        EquipmentSlot.OFF_HAND,
                                    ];
                                    var lastNewItem = null;
                                    
                                    try {
                                        equipmentSlots.push(EquipmentSlot.valueOf("BODY"));
                                    } catch (e) {}

                                    try {
                                        equipmentSlots.push(EquipmentSlot.valueOf("SADDLE"));
                                    } catch (e) {}

                                    materialsData.every(function(material) {
                                        inventoryTarget = inventoryTargetSaved;

                                        var rawTargetMaterial = material.split("|");
                                        var targetMaterialExact = null;
                                        if (rawTargetMaterial.length === 1) targetMaterialExact = rawTargetMaterial[0];
                                        else if (rawTargetMaterial.length === 2 && rawTargetMaterial[0] === "OPENED") {
                                            targetMaterialExact = rawTargetMaterial[1];
                                            if (target instanceof HumanEntity) inventoryTarget = target.getOpenInventory().getTopInventory();
                                        }
                                        else if (rawTargetMaterial.length === 2 && rawTargetMaterial[0] === "EC") {
                                            targetMaterialExact = rawTargetMaterial[1];
                                            if (target instanceof HumanEntity) inventoryTarget = target.getEnderChest();
                                        }

                                        var material = Material.matchMaterial(targetMaterialExact);
                                        if (!material) {
                                            Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Unknown material " + targetMaterialExact);
                                            return;
                                        }

                                        var length = inventoryTarget.getSize ? inventoryTarget.getSize() : equipmentSlots.length;

                                        for (var i = 0; i < length; i++) {
                                            var slot = inventoryTarget.getSize ? i : equipmentSlots[i];
                                            var item = inventoryTarget.getItem(slot);

                                            if ((item != null && item.getType() == material) || (item == null && material == Material.AIR)) {
                                                function localCounts() {
                                                    if (options.source[amount.source].overridePartialCountsOverGeneralCounts === "true") {
                                                        if (options.source[amount.source].material.counts > -1 && counts.source.material >= options.source[amount.source].material.counts) return false;
                                                        if (options.source[amount.source].counts > -1 && options.source[amount.source].material.counts === -1 && counts.source.general >= options.source[amount.source].counts) return false;
                                                    } else {
                                                        if (options.source[amount.source].counts > -1 && counts.source.general >= options.source[amount.source].counts) return false;
                                                        if (options.source[amount.source].material.counts > -1 && options.source[amount.source].counts === -1 && counts.source.material >= options.source[amount.source].material.counts) return false;
                                                    }
                                                    return true;
                                                }

                                                if (params.counts && params.overrideOrderCountsOverGlobalCounts === "true") {
                                                    if (options.source[amount.source].material.counts > -1 || options.source[amount.source].counts > -1) {
                                                        if (!localCounts()) return false;
                                                    } else {
                                                        if (replacedCount.count >= params.counts) return false;
                                                    }
                                                } else if (params.counts) {
                                                    if (replacedCount.count >= params.counts) return false;
                                                } else {
                                                    if (!localCounts()) return false;
                                                }

                                                if (params.counts) replacedCount.count++;
                                                if (options.source[amount.source].counts > -1) counts.source.general++;
                                                if (options.source[amount.source].material.counts > -1) counts.source.material++;

                                                inventoryTarget.setItem(slot, sourceItem.clone());
                                                if (params.switch && params.switch === "true") lastNewItem = item;
                                            }
                                        }

                                        return true;
                                    });

                                    if (lastNewItem) cursorSource ? source.setItemOnCursor(lastNewItem.clone()) : inventorySource.setItem(sourceSlotIndex, lastNewItem.clone());
                                }
                            }
                        }
                        
                        if (slotFurtherMaterial) {
                            material();
                            slot();
                        } else {
                            slot();
                            material();
                        }
                        
                        break;
                    case "slot":
						var slotsData = params.slot.split(",").map(function(s) { return s.trim(); });
                        if (options.slot[amount.slot].slotOverride !== "null") {
                            var optionsNewSlots = "" + options.slot[amount.slot].slotOverride + "";
                            var newSlots = optionsNewSlots.split("~").map(function(s) { return s.trim(); });
                            slotsData = newSlots;
                        }
                        if (options.slot[amount.slot].slotAdd !== "null") {
                            var optionsNewSlots = "" + options.slot[amount.slot].slotAdd + "";
                            var newSlots = optionsNewSlots.split("~").map(function(s) { return s.trim(); });
                            slotsData = slotsData.concat(newSlots);
                        }
                            
                        slotsData.every(function(slot) {
                			inventoryTarget = inventoryTargetSaved;
                                
                            var rawTargetSlot = slot.toUpperCase().split("|");
                            var targetSlotExact = null;
                            if (rawTargetSlot.length === 1) targetSlotExact = rawTargetSlot[0];
                            else if (rawTargetSlot.length === 2 && rawTargetSlot[0] === "OPENED") {
                                targetSlotExact = rawTargetSlot[1];
                                if (target instanceof HumanEntity) inventoryTarget = target.getOpenInventory().getTopInventory();
                            }
                            else if (rawTargetSlot.length === 2 && rawTargetSlot[0] === "EC") {
                                targetSlotExact = rawTargetSlot[1];
                                if (target instanceof HumanEntity) inventoryTarget = target.getEnderChest();
                            }
                                
                            var targetSlotIndex = null;
                            if (inventoryTarget.getSize) {
                                try {
                                    targetSlotIndex = EquipmentSlot.valueOf(targetSlotExact);
                                } catch (e) {
                                	targetSlotIndex = !isNaN(targetSlotExact) ? parseInt(targetSlotExact) : targetSlotExact === "CURSOR" && target instanceof HumanEntity ? "CURSOR" : undefined;
                                }
                                    
                                if ((!isNaN(targetSlotIndex) && (targetSlotIndex < 0 || targetSlotIndex >= inventoryTarget.getSize())) || (isNaN(targetSlotIndex) && !targetSlotIndex)) {
                                    Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Invalid target slot " + targetSlotExact);
                                    return true;
                                }
                            } else {
                                try {
                                    targetSlotIndex = EquipmentSlot.valueOf(targetSlotExact);
                                } catch (e) {
                                    Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Invalid target equipment slot " + targetSlotExact);
                                    return true;
                                }
                                    
                                if (isNaN(targetSlotIndex) && !targetSlotIndex) {
                                    Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Invalid target equipment slot " + targetSlotExact);
                                    return true;
                                }
                            }
                                            
                            if (params.counts && params.overrideOrderCountsOverGlobalCounts === "true") {
                            	if (options.slot[amount.slot].counts > -1) {
                                	if (counts.slot >= options.slot[amount.slot].counts) return false;   
                                } else {
                                	if (replacedCount.count >= params.counts) return false;
                                }
                            } else if (params.counts) {
                            	if (replacedCount.count >= params.counts) return false;
                            } else {
                            	if (options.slot[amount.slot].counts > -1 && counts.slot >= options.slot[amount.slot].counts) return false;   
                            }

                            if (params.counts) replacedCount.count++;
                            if (options.slot[amount.slot].counts > -1) counts.slot++;

                            var cursorTarget = targetSlotIndex === "CURSOR" && target.getItemOnCursor;
                           	var item = cursorTarget ? target.getItemOnCursor() : inventoryTarget.getItem(targetSlotIndex);
                            
                            if (item) cdMat = item.getType();
                           	applyMetaChange(target, inventoryTarget, targetSlotIndex, item, params, cursorTarget, options, amount);
                                
                            return true;
						});
                            
                        break;
                    case "material":
                        var rawMaterialsData = params.material ? params.material.toUpperCase().split(",").map(function(s) { return s.trim(); }) : [];
                        var materialsData = sourceMaterial && options.material[amount.material] && options.material[amount.material].useSourceMaterialIfFurther === "true" ? [sourceMaterial] : rawMaterialsData;
                        if (sourceMaterial) {
                            rawMaterialsData.every(function(m) {
                                if ((m.split("|")[0] === "OPENED" && options.material[amount.material] && options.material[amount.material].applyOpenedToSourceMaterial === "ifExists") || (options.material[amount.material] && options.material[amount.material].applyOpenedToSourceMaterial === "anyway")) {
                                    materialsData.push("OPENED|" + sourceMaterial);
                                    return false;
                                }
                                return true;
                            });
                        }
                        
                        if (options.material[amount.material].materialOverride !== "null") {
                            var optionsNewMaterials = "" + options.material[amount.material].materialOverride + "";
                            var newMaterials = optionsNewMaterials.split("~").map(function(s) { return s.trim(); });
                            materialsData = newMaterials;
                        }
                        if (options.material[amount.material].materialAdd !== "null") {
                            var optionsNewMaterials = "" + options.material[amount.material].materialAdd + "";
                            var newMaterials = optionsNewMaterials.split("~").map(function(s) { return s.trim(); });
                            materialsData = materialsData.concat(newMaterials);
                        }
                        
                        var equipmentSlots = [
                            EquipmentSlot.HEAD,
                            EquipmentSlot.CHEST,
                            EquipmentSlot.LEGS,
                            EquipmentSlot.FEET,
                            EquipmentSlot.HAND,
                            EquipmentSlot.OFF_HAND
                        ];
                        
                        try {
                        	equipmentSlots.push(EquipmentSlot.valueOf("BODY"));
                        } catch (e) {}

                        try {
                        	equipmentSlots.push(EquipmentSlot.valueOf("SADDLE"));
                        } catch (e) {}
                            
                        materialsData.every(function(material) {
                			inventoryTarget = inventoryTargetSaved;
                                
                            var rawTargetMaterial = material.split("|");
                            var targetMaterialExact = null;
                            if (rawTargetMaterial.length === 1) targetMaterialExact = rawTargetMaterial[0];
                            else if (rawTargetMaterial.length === 2 && rawTargetMaterial[0] === "OPENED") {
                                targetMaterialExact = rawTargetMaterial[1];
                                if (target instanceof HumanEntity) inventoryTarget = target.getOpenInventory().getTopInventory();
                            }
                            else if (rawTargetMaterial.length === 2 && rawTargetMaterial[0] === "EC") {
                                targetMaterialExact = rawTargetMaterial[1];
                                if (target instanceof HumanEntity) inventoryTarget = target.getEnderChest();
                            }

                            var material = Material.matchMaterial(targetMaterialExact);
                            if (!material) {
                                Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Unknown material " + targetMaterialExact);
                                return;
                            }
                                
                            var length = inventoryTarget.getSize ? inventoryTarget.getSize() : equipmentSlots.length;
                                    
                            for (var i = 0; i < length; i++) {
                                var slot = inventoryTarget.getSize ? i : equipmentSlots[i];
								var item = inventoryTarget.getItem(slot);
                                
                                if ((item != null && item.getType() == material) || (item == null && material == Material.AIR)) {
                                    if (params.counts && params.overrideOrderCountsOverGlobalCounts === "true") {
                                        if (options.material[amount.material].counts > -1) {
                                            if (counts.material >= options.material[amount.material].counts) return false;   
                                        } else {
                                            if (replacedCount.count >= params.counts) return false;
                                        }
                                    } else if (params.counts) {
                                        if (replacedCount.count >= params.counts) return false;
                                    } else {
                                        if (options.material[amount.material].counts > -1 && counts.material >= options.material[amount.material].counts) return false;
                                    }

                                    if (params.counts) replacedCount.count++;
                                    if (options.material[amount.material].counts > -1) counts.material++;

                                    if (item) cdMat = item.getType();
                           			applyMetaChange(target, inventoryTarget, slot, item, params, false, options, amount);
                                }                                
                            }
                                
                            return true;
                        });
                            
                        break;
                    default:
                        break;
                }
            }
            
            var order = params.order ? params.order.split(",") : ["source", "slot", "material"];
            var optionsEach = {
                "material": {},
                "source": {},
                "slot": {}
            };
            var amountEach = {
                "material": 0,
                "source": 0,
                "slot": 0
            };
            var optionsExact = {
                "material": {
                    "useSourceMaterialIfFurther": "false",
                    "applyOpenedToSourceMaterial": "false",
                    "materialAdd": "null",
                    "materialOverride": "null",
                    "counts": -1
                },
                "source": {
                    "useNewMaterialIfFurther": "false",
                    "applyOpenedToNewMaterial": "false",
                    "overridePartialCountsOverGeneralCounts": "false",
                    "counts": -1,
                    "material": {
                        "counts": -1
                    },
                    "slot": {
                        "counts": -1
                    }
                },
                "slot": {
                    "slotAdd": "null",
                    "slotOverride": "null",
            		"counts": -1
                }
            };
            
            function deepCopy(obj) {
                return JSON.parse(JSON.stringify(obj));
            }
            
            function passing() {
                order.forEach(function(o) {
                    optionsEach.material[amountEach.material] = deepCopy(optionsExact.material);
                    optionsEach.source[amountEach.source] = deepCopy(optionsExact.source);
                    optionsEach.slot[amountEach.slot] = deepCopy(optionsExact.slot);
                    
                    if (o.startsWith("material") && o.contains("{") && o.contains("}")) {
                        var rawMaterialOptions = o.substring(o.indexOf("{")+1, o.indexOf("}")).split("`");
                        for (var i = 0; i < rawMaterialOptions.length; i++) {
                            var param = rawMaterialOptions[i].trim().split("=");
                            if (param.length == 2) {
                                optionsEach.material[amountEach.material][param[0].trim()] = isNaN(param[1]) ? param[1].trim() : parseInt(param[1]);
                            } else {
                                Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Invalid material option format in order parameter at position " + (i + 1) + ": " + args[i]);
                                continue;
                            }
                        }
                        amountEach.material++;
                    }

                    if (o.startsWith("source")) {
                        if (o.contains("{") && o.contains("}")) {
                            var rawSourceOptions = o.substring(o.indexOf("{")+1, o.indexOf("}")).split("`");
                            for (var i = 0; i < rawSourceOptions.length; i++) {
                                var param = rawSourceOptions[i].trim().split("=");
                                if (param.length === 2) {
                                    var path = param[0].trim().split(".");
                                    var value = param[1].trim();

                                    var current = optionsEach.source[amountEach.source];
                                    for (var j = 0; j < path.length - 1; j++) {
                                        if (!(path[j] in current)) {
                                            current[path[j]] = {};
                                        }
                                        current = current[path[j]];
                                    }

                                    current[path[path.length - 1]] = isNaN(value) ? value : parseInt(value);
                                } else {
                                    Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Invalid source option format in order parameter at position " + (i + 1) + ": " + args[i]);
                                    continue;
                                }
                            }
                            amountEach.source++;
                        } else if (o.contains("(") && o.contains(")")) {
                            amountEach.source++;
                        }
                    }

                    if (o.startsWith("slot") && o.contains("{") && o.contains("}")) {
                        var rawSlotOptions = o.substring(o.indexOf("{")+1, o.indexOf("}")).split("`");
                        for (var i = 0; i < rawSlotOptions.length; i++) {
                            var param = rawSlotOptions[i].trim().split("=");
                            if (param.length == 2) {
                                optionsEach.slot[amountEach.slot][param[0].trim()] = isNaN(param[1]) ? param[1].trim() : parseInt(param[1]);
                            } else {
                                Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Invalid slot option format in order parameter at position " + (i + 1) + ": " + args[i]);
                                continue;
                            }
                        }
                        amountEach.slot++;
                    }
                    
                    switch (o) {
                        case "source":
                            amountEach.source++;
                            break;
                        case "slot":
                            amountEach.slot++;
                            break;
                        case "material":
                            amountEach.material++;
                            break;
                        default:
                            break;
                    }
                });
                
                amountEach.material = 0;
                amountEach.source = 0;
                amountEach.slot = 0;

                order.forEach(function(o) {
                    if (o.startsWith("source") && params.source_slot) {
                        if (o.contains("(") && o.contains(")")) {
                            var sourceOrder = o.substring(o.indexOf("(")+1, o.indexOf(")")).split("`");

                            processTargets("source", sourceOrder.indexOf("slot") !== -1, sourceOrder.indexOf("material") !== -1, sourceOrder.indexOf("slot") > sourceOrder.indexOf("material"), optionsEach, amountEach);
                    	} else if (o.contains("{") && o.contains("}")) {
                            processTargets("source", true, true, false, optionsEach, amountEach);
                        }
                        counts.source.general = 0;
                        counts.source.material = 0;
                        counts.source.slot = 0;
                        amountEach.source++;
                	}

                    if (o.startsWith("material") && o.contains("{") && o.contains("}") && (params.material || sourceMaterial)) {
                        processTargets("material", null, null, null, optionsEach, amountEach);
                        counts.material = 0;
                        amountEach.material++;
                    }

                    if (o.startsWith("slot") && o.contains("{") && o.contains("}") && params.slot) {
                        processTargets("slot", null, null, null, optionsEach, amountEach);
                        counts.slot = 0;
                        amountEach.slot++;
                    }

                    switch (o) {
                        case "source":
                            if (params.source_slot) {
                                processTargets("source", true, true, false, optionsEach, amountEach);
                                counts.source.general = 0;
                                counts.source.material = 0;
                                counts.source.slot = 0;
                                amountEach.source++;
                            }
                            break;
                        case "slot":
                            if (params.slot) {
                                processTargets("slot", null, null, null, optionsEach, amountEach);
                                counts.slot = 0;
                                amountEach.slot++;
                            }
                            break;
                        case "material":
                            if (params.material || sourceMaterial) {
                                processTargets("material", null, null, null, optionsEach, amountEach);
                                counts.material = 0;
                                amountEach.material++;
                            }
                            break;
                        default:
                            break;
                    }
                });
            }
            
            passing();
            
            function applyMetaChange(entity, inventory, slot, item, params, cursor, options, amount) {
                if ((params.newMaterial || params.durability || params.name || params.lore || params.enchantments || params.flags || params.customModelData || params.dataContainer || params.amount || params.maxStack || params.cooldown || params.cooldownBasic) && !params.action) {
                    Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Missing 'action' parameter!");
                    return;
                }
                    if (params.action == "set" && params.newMaterial) {
                        var newMaterial = Material.matchMaterial(params.newMaterial);
                        if (newMaterial != null) {
                            if (newMaterial == Material.AIR) {
                                if (item == null || item.getType() == Material.AIR) {
                                    if (replacedCount.count > 0) replacedCount.count--;
                                    if (counts.material > 0) counts.material--;
                                } else {
                                    var newItem = new ItemStack(Material.AIR, 1);
                                    cursor ? entity.setItemOnCursor(newItem) : inventory.setItem(slot, newItem);
                                    item = cursor ? entity.getItemOnCursor() : inventory.getItem(slot);
                                    if (options.source && checkNesting(options.source, "useNewMaterialIfFurther", "true")) newMaterialGlobal = item.getType().toString();
                                }
                            } else {
                                if (item != null && item.getType() != Material.AIR) {
                                    item.setType(newMaterial);
                                } else {
                                    var newItem = new ItemStack(Material.valueOf(newMaterial), 1);
                                    cursor ? entity.setItemOnCursor(newItem) : inventory.setItem(slot, newItem);
                                    item = cursor ? entity.getItemOnCursor() : inventory.getItem(slot);
                                }
                                if (options.source && checkNesting(options.source, "useNewMaterialIfFurther", "true")) newMaterialGlobal = item.getType().toString();
                            }
                        } else {
                            if (replacedCount.count > 0) replacedCount.count--;
                            if (counts.material > 0) counts.material--;
                            Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Invalid new material specified.");
                        }
                    }

                    if (item != null && item.getType() != Material.AIR) {
                        var meta = item.getItemMeta();
                        if (meta == null) {
                            Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Item does not have meta data!");
                            return;
                        }

                        if (params.durability) {
                            var durability = parseInt(params.durability);
                            switch (params.action) {
                                case "set":
                                    meta.setDamage(item.getType().getMaxDurability() - durability);
                                	break;
                                case "reset":
                                    meta.setDamage(0);
                                	break;
                                case "increase":
                                    meta.setDamage(item.getType().getMaxDurability() - ((item.getType().getMaxDurability() - meta.getDamage()) + durability));
                                	break;
                                case "decrease":
                                    meta.setDamage(item.getType().getMaxDurability() - ((item.getType().getMaxDurability() - meta.getDamage()) - durability));
                                    break;
                                case "multiply":
                                    meta.setDamage(item.getType().getMaxDurability() - ((item.getType().getMaxDurability() - meta.getDamage()) * durability));
                                    break;
                                case "divide":
                            		if (durability === 0) Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Can not divide by zero!");
                                    else meta.setDamage(item.getType().getMaxDurability() - ((item.getType().getMaxDurability() - meta.getDamage()) / durability));
                                    break;
                                default:
                                    break;
                            }
                        }
                        
                        if (params.action == "set" && params.lore) {
                            var loreEntries = params.lore.split("|");
                            var currentLore = meta.hasLore() ? meta.getLore().toArray() : java.util.Arrays.asList().toArray();
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
                        
                        if (params.action == "set" && params.enchantmentsBook) {
                            if (meta instanceof EnchantmentStorageMeta) {
                                var enchantmentArgs = params.enchantmentsBook.split(",");
                                enchantmentArgs.forEach(function (enchantmentStr) {
                                    var parts = enchantmentStr.split("=");
                                    var enchantmentName = parts[0].trim();
                                    var enchantmentLevel = parseInt(parts[1].trim());
                                    var enchantment = Enchantment.getByName(enchantmentName.toUpperCase());
                                    if (enchantment != null) {
                                        meta.addStoredEnchant(enchantment, enchantmentLevel, true);
                                    } else {
                                        Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Unknown enchantment " + enchantmentName + " (is this what enchantment is called on your server version?)");
                                    }
                                });
                            }
                        } else if (params.action == "remove" && params.enchantmentsBook) {
                            if (meta instanceof EnchantmentStorageMeta) {
                                var enchantmentArgs = params.enchantmentsBook.split(",");
                                enchantmentArgs.forEach(function (enchantmentStr) {
                                    var enchantmentName = enchantmentStr.split("=")[0].trim();
                                    var enchantment = Enchantment.getByName(enchantmentName.toUpperCase());
                                    if (enchantment != null) {
                                        meta.removeStoredEnchant(enchantment);
                                    } else {
                                        Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Unknown enchantment " + enchantmentName + " (is this what enchantment is called on your server version?)");
                                    }
                                });
                            }
                        } else if (params.action == "reset" && params.enchantmentsBook) {
                            if (meta instanceof EnchantmentStorageMeta) {
                                meta.getStoredEnchants().keySet().forEach(function(enchantment) {
                                    meta.removeStoredEnchant(enchantment);
                                });
                            }
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

                        if (params.amount) {
                            var amount = parseInt(params.amount);
                            switch (params.action) {
                                case "set":
                                    item.setAmount(amount);
                                	break;
                                case "increase":
                                    item.setAmount(item.getAmount() + amount);
                                	break;
                                case "decrease":
                                    item.setAmount(item.getAmount() - amount);
                                    break;
                                case "multiply":
                                    item.setAmount(item.getAmount() * amount);
                                    break;
                                case "divide":
                                    item.setAmount(item.getAmount() / amount);
                                    break;
                                default:
                                    break;
                            }
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
                                Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: MaxStack option is only available on 1.20.5+!");
                            } else {
                                var stack = parseInt(params.maxStack);
                                if (stack < 1 || stack > 99) {
                                    Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Invalid maxStack.");
                                } else meta.setMaxStackSize(stack);
                            }
                        } else if (params.action == "reset" && params.maxStack) {
                            if (!supportsNewMaxStackSize) {
                                Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: MaxStack option is only available on 1.20.5+!");
                            } else {
                            	meta.setMaxStackSize(item.getType().getMaxStackSize());
                            }
                        }

                        if (params.cooldown) {
                            var cooldown = parseInt(params.cooldown);
                            if (!cooldown && cooldown !== 0) {
                                Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Invalid cooldown.");
                            } else {
                                if (entity instanceof HumanEntity) {
                                    try {
                                        var mats = params.material ? params.material.toUpperCase().split(",") : [];
                                        if (params.material && mats.indexOf(cdMat.toString()) !== -1) {
                                            if (cdMat !== cdMatCur) {
                                                if (params.action === "set") entity.setCooldown(cdMat, cooldown);
                                                else if (params.action === "reset") entity.setCooldown(cdMat, 0);
                                                cdMatCur = cdMat;
                                            }
                                        }
                                        if (params.slot && mats.indexOf(cdMat.toString()) === -1) {
                                            var cdComponent = meta.getUseCooldown();
                                            var cdExist = cdComponent.getCooldownGroup();
                                            if (!cdExist) {
                                                var plugin = Bukkit.getPluginManager().getPlugin("TriggerReactor");
                                                cdComponent.setCooldownGroup(new NamespacedKey(plugin, randomDigitString(6)));
                                                meta.setUseCooldown(cdComponent);
                                                item.setItemMeta(meta);
                                            }
                                            
                                            if (params.action === "set") {
                                                entity.setCooldown(item, cooldown);
                                                if (!cdExist) {
                                                    Bukkit.getScheduler().runTaskLater(plugin, new java.lang.Runnable({
                                                        run: function() {
                                                            cdComponent.setCooldownGroup(null);
                                                            meta.setUseCooldown(cdComponent);
                                                            item.setItemMeta(meta);
                                                        }
                                                    }), cooldown);
                                                }
                                            } else if (params.action === "reset") {
                                                entity.setCooldown(item, 0);
                                                if (!cdExist) {
                                                    cdComponent.setCooldownGroup(null);
                                                    meta.setUseCooldown(cdComponent);
                                                    item.setItemMeta(meta);
                                                }
                                            }
                                        }
                                    } catch (e) {}
                                }
                            }
                        }
                        
                        if (params.cooldownBasic) {
                            var cooldown = parseFloat(params.cooldownBasic);
                            if (!cooldown && cooldown !== 0) {
                                Bukkit.getLogger().warning("[CEActions] CHANGE_ITEM ACTION: Invalid cooldown.");
                            } else {
                            	try {
                                    var cdComponent = meta.getUseCooldown();
                                    var plugin = Bukkit.getPluginManager().getPlugin("TriggerReactor");
                                    cdComponent.setCooldownGroup(new NamespacedKey(plugin, randomDigitString(6)));
                                    if (params.action === "set") cdComponent.setCooldownSeconds(cooldown);
                                    else if (params.action === "reset") cdComponent = null;
                                    meta.setUseCooldown(cdComponent);
                                    item.setItemMeta(meta);
                                } catch (e) {}
                            }
                        }

                        item.setItemMeta(meta);

                        if (!(entity instanceof Player) && newMaterial != Material.AIR) inventory.setItem(slot, item);
                    }
            }
		}
    });
    
    var changeItemInstance = new ChangeItemAction("change_item");
    
    return changeItemInstance;
}

CEchangeItem();
