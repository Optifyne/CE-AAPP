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
var ConditionalEventsAction = Java.type("ce.ajneb97.api.ConditionalEventsAction");
var InventoryType = Java.type("org.bukkit.event.inventory.InventoryType");
var ItemStack = Java.type("org.bukkit.inventory.ItemStack");
var InventoryHolder = Java.type("org.bukkit.inventory.InventoryHolder");
var BlockInventoryHolder = Java.type("org.bukkit.inventory.BlockInventoryHolder");
var BlockStateMeta = Java.type("org.bukkit.inventory.meta.BlockStateMeta");
var HumanEntity = Java.type("org.bukkit.entity.HumanEntity");
var EquipmentSlot = Java.type("org.bukkit.inventory.EquipmentSlot");
var Merchant = Java.type("org.bukkit.inventory.Merchant");
var AbstractVillager = Java.type("org.bukkit.entity.AbstractVillager");
var Material = Java.type("org.bukkit.Material");
var HashMap = Java.type("java.util.HashMap");
var File = Java.type("java.io.File");
var FileWriter = Java.type("java.io.FileWriter");
var FileReader = Java.type("java.io.FileReader");
var BufferedReader = Java.type("java.io.BufferedReader");
var BufferedWriter = Java.type("java.io.BufferedWriter");
var Gson = Java.type("com.google.gson.Gson");
var GsonBuilder = Java.type("com.google.gson.GsonBuilder");
var Base64 = Java.type("java.util.Base64");
var ByteArrayOutputStream = Java.type("java.io.ByteArrayOutputStream");
var ByteArrayInputStream = Java.type("java.io.ByteArrayInputStream");
var BukkitObjectOutputStream = Java.type("org.bukkit.util.io.BukkitObjectOutputStream");
var BukkitObjectInputStream = Java.type("org.bukkit.util.io.BukkitObjectInputStream");

var customTempInventories = new HashMap();

function CEmanageInventory() {
    var ManageInventoryAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine, minecraftEvent) {
            var args = actionLine.split(";");
            if (args.length < 2) {
                Bukkit.getLogger().warning("[CEActions] MANAGE_INVENTORY ACTION: Invalid actionLine format! CORRECT FORMAT: manage_inventory: action:<action (save|open|delete, you can add ? before the action to use the temporary inventories storage, that is, until server restart, note that the 'open' or 'delete', for example, can not be used to open or delete inventory saved with '?save', and the logic will be the same for other action combinations)>;(can be skipped in case of open) inventory:<inventory_id (indicates by which id/name the inventory will be used)>;(optional, only in case of open) fake:<true|false (indicates whether the real functionality of the inventory will persist or not, for example with anvil - it can be just visual inventory or real inventory with all functions)>;(optional, only in case of save or open) owner:<entity_uuid|player_name|world,x,y,z (indicates which inventory will be used (for example of some player), if specified, all other properties will be ignored, you also can use ^ before the nickname to use the open player's inventory, also you can use |<slot (indices or named slots)> after to get inventory of the some item (for example, shulker box))>;(optional, only in case of save or open) holder:<inventory_holder (world,x,y,z|entity_uuid|player_name)>;(only in case of open) target:<player (for which player the inventory will be opened)>;(only in case of save or open) typeOrSize:<inventory_type (for example: CHEST) or integer size (must be a multiple of 9 between 9 and 54 slots, for example: 18)>;(optional, only in case of save or open) title:<inventory_title>");
                return;
            }
            
            var params = {};
            for (var i = 0; i < args.length; i++) {
                var param = args[i].trim().split(":");
                if (param.length == 2) {
                    params[param[0].trim()] = param[1].trim();
                } else {
                    Bukkit.getLogger().warning("[CEActions] MANAGE_INVENTORY ACTION: Invalid parameter format at position " + (i + 1) + ": " + args[i]);
                    return;
                }
            }
            
            if (!params.action) {
                Bukkit.getLogger().warning("[CEActions] MANAGE_INVENTORY ACTION: Missing 'action' parameter!");
                return;
            }
                        
            var temp = params.action.startsWith("?");
            var action = temp ? params.action.substring(1) : params.action;
            
            var validMaterials = [Material.ANVIL, Material.CARTOGRAPHY_TABLE, Material.ENCHANTING_TABLE, Material.GRINDSTONE, Material.LOOM, Material.SMITHING_TABLE, Material.STONECUTTER, Material.CRAFTING_TABLE];
            
            var validInventoryTypes = [InventoryType.ANVIL, InventoryType.CARTOGRAPHY, InventoryType.ENCHANTING, InventoryType.GRINDSTONE, InventoryType.LOOM, InventoryType.SMITHING, InventoryType.STONECUTTER, InventoryType.WORKBENCH];
            
            try {
                validMaterials.push(Material.WORKBENCH);
            } catch (e) {}
            
            var validMaterialsAndInventoriesMap = {
                "ANVIL": InventoryType.ANVIL,
                "CARTOGRAPHY_TABLE": InventoryType.CARTOGRAPHY,
                "ENCHANTING_TABLE": InventoryType.ENCHANTING,
                "GRINDSTONE": InventoryType.GRINDSTONE,
                "LOOM": InventoryType.LOOM,
                "SMITHING_TABLE": InventoryType.SMITHING,
                "STONECUTTER": InventoryType.STONECUTTER,
                "CRAFTING_TABLE": InventoryType.WORKBENCH,
                "WORKBENCH": InventoryType.WORKBENCH
            }
            
            function itemStackToBase64(item) {
                var out = new ByteArrayOutputStream();
                var dataOut = new BukkitObjectOutputStream(out);
                dataOut.writeObject(item);
                dataOut.close();
                return Base64.getEncoder().encodeToString(out.toByteArray());
            }

            function itemStackFromBase64(base64) {
                if (!base64 || typeof base64 !== "string") return null;
                try {
                    var bytes = java.util.Base64.getDecoder().decode(base64);
                    var bais = new java.io.ByteArrayInputStream(bytes);
                    var ois = new org.bukkit.util.io.BukkitObjectInputStream(bais);
                    var item = ois.readObject();
                    ois.close();
                    return item;
                } catch (e) {
                    return null;
                }
            }
            
            var gson = new GsonBuilder().setPrettyPrinting().create();
            
            function loadInventoriesFile() {
                var file = new File("plugins/TriggerReactor/inventories.json");
                if (!file.exists()) return {};

                var reader = new BufferedReader(new FileReader(file));
                var json = "", line;
                while ((line = reader.readLine()) !== null) {
                    json += line;
                }
                reader.close();

                var parsed = gson.fromJson(json, HashMap.class);
                var result = {};

                var keys = parsed.keySet().toArray();
                for (var i = 0; i < keys.length; i++) {
                    var name = keys[i];
                    var inventoryData = parsed.get(name);

                    var contentsRaw = inventoryData.get("contents");
                    var contentsNew = [];
                    var size = parseInt(inventoryData.get("typeOrSize"));
                    for (var k = 0; k < size; k++) {
                        contentsNew.push(null);
                    }

                    if (contentsRaw != null) {
                        var contentKeys = contentsRaw.keySet().toArray();
                        for (var j = 0; j < contentKeys.length; j++) {
                            var slot = parseInt(contentKeys[j]);
                            contentsNew[slot] = itemStackFromBase64(contentsRaw.get(contentKeys[j]));
                        }
                    }

                    result[name] = {
                        holder: inventoryData.get("holder"),
                        typeOrSize: inventoryData.get("typeOrSize"),
                        constantType: inventoryData.get("constantType"),
                        title: inventoryData.get("title"),
                        contents: contentsNew
                    };
                }

                return result;
            }

            function saveInventoriesFile(inventories) {
                var file = new File("plugins/TriggerReactor/inventories.json");
                var toSave = {};

                for (var inv in inventories) {
                    var invData = inventories[inv];

                    var serializedContents = {};
                    if (invData.contents && Array.isArray(invData.contents)) {
                        for (var i = 0; i < invData.contents.length; i++) {
                            var item = invData.contents[i];
                            if (item != null) {
                                serializedContents[i] = itemStackToBase64(item);
                            }
                        }
                    }

                    toSave[inv] = {
                        holder: invData.holder,
                        typeOrSize: invData.typeOrSize,
                        constantType: invData.constantType,
                        title: invData.title,
                        contents: serializedContents
                    };
                }

                var writer = new BufferedWriter(new FileWriter(file));
                gson.toJson(toSave, writer);
                writer.close();
            }
            
            function parseInventoryHolder(identifier, returnUUID) {
                if (!identifier || identifier === "") return null;
                
                var playerHolder = Bukkit.getPlayer(identifier);
                if (playerHolder && playerHolder instanceof InventoryHolder) return returnUUID ? playerHolder.getUniqueId() : playerHolder;

                try {
                    var uuid = java.util.UUID.fromString(identifier);
                    var entityHolder = Bukkit.getEntity(uuid);
                    if (entityHolder && (entityHolder instanceof InventoryHolder || entityHolder.getEquipment)) return returnUUID ? entityHolder.getUniqueId() : entityHolder;
                } catch (e) {
                    if (identifier.indexOf(",") !== -1) {
                        var parts = identifier.split(",");
                        if (parts.length === 4) {
                            var world = Bukkit.getWorld(parts[0]);
                            var x = parseInt(parts[1]);
                            var y = parseInt(parts[2]);
                            var z = parseInt(parts[3]);
                            if (world && !isNaN(x) && !isNaN(y) && !isNaN(z)) {
                                var block = world.getBlockAt(x, y, z);
                                if (block) {
                                    if (block.getState() && block.getState() instanceof InventoryHolder) return block.getState();
                                    if (validMaterials.indexOf(block.getType() !== -1)) {
                                        var blockHolder = {};
                                        blockHolder["material"] = block.getType().toString();
                                        blockHolder["location"] = block.getLocation();
                                        return blockHolder;
                                    }
                                }
                            }
                        }
                    }
                }

                return null;
            }
                       
            var inventoryMap = temp ? customTempInventories : loadInventoriesFile();

            switch (action) {
                case "save":
                    if (!params.inventory) {
                        Bukkit.getLogger().warning("[CEActions] MANAGE_INVENTORY ACTION: Inventory ID is not specified.");
                        return;
                    }
                    
                    var inv = null;
                    var invData = null;
                    if (params.owner) {
                        var opened = params.owner.startsWith("^");
                        var itemInventory = params.owner.split("|");
                        var itemSlot = null;
                        
                        try {
                        	itemSlot = itemInventory.length === 2 ? !isNaN(itemInventory[1]) ? parseInt(itemInventory[1]) : EquipmentSlot.valueOf(itemInventory[1]) : null;
                        } catch (e) {
                            itemSlot = null;
                        }
                        
                        var preParsedOwner = params.owner;
                        if (opened) preParsedOwner = params.owner.substring(1);
                        if (itemSlot != null) preParsedOwner = preParsedOwner.split("|")[0];
                        
                        var owner = parseInventoryHolder(preParsedOwner, false);
                        if (owner) {
                            function returnItemInventory(inventory, slot) {
                                if (slot != null) {
                                    try {
                                        var item = inventory.getItem(slot);
                                        var meta = item ? item.getItemMeta() : null;
                                        if (meta && meta instanceof BlockStateMeta && meta.hasBlockState()) {
                                            var state = meta.getBlockState();
                                            if (state && state.getInventory) return state.getInventory();
                                        }
                                    } catch (e) {
                                        return null;
                                    }
                                }
                                return null;
                            }
                            
                            if (opened && owner instanceof HumanEntity) {
                                inv = owner.getOpenInventory().getTopInventory();
                                inv = returnItemInventory(inv, itemSlot) || inv;
                            } else if (Material.matchMaterial(owner.material)) {
                                inv = owner.material;
                            } else {
                            	inv = owner.getInventory ? owner.getInventory() : null;
                                inv = returnItemInventory(owner.getInventory ? owner.getInventory() : owner.getEquipment(), itemSlot) || inv;
                            }
                            if (inv) {
                                if (inv.getSize && !(owner instanceof HumanEntity) && !(owner instanceof BlockInventoryHolder) && !(owner instanceof AbstractVillager) && (inv.getSize() < 9 || inv.getSize() > 54 || inv.getSize() % 9 !== 0)) {
                                    Bukkit.getLogger().warning("[CEActions] MANAGE_INVENTORY ACTION: Invalid owner's inventory size.");
                                } else {
                                    if (Material.matchMaterial(inv)) {
                                        if (validMaterialsAndInventoriesMap[inv]) invData = { "holder": parseInventoryHolder(params.holder, true), "typeOrSize": validMaterialsAndInventoriesMap[inv], "constantType": validMaterialsAndInventoriesMap[inv], "title": params.title || inv };
                                    } else invData = { "holder": parseInventoryHolder(params.holder, true) || (owner.getUniqueId ? owner.getUniqueId() : preParsedOwner), "typeOrSize": inv.getSize(), "constantType": inv.getType(), "title": params.title || ((parseInventoryHolder(params.holder, false) || owner).getName ? (parseInventoryHolder(params.holder, false) || owner).getName() : preParsedOwner + "'s inventory") };
                                }
                        	} else {
                                Bukkit.getLogger().warning("[CEActions] MANAGE_INVENTORY ACTION: Invalid inventory type.");
                            	return;
                            }
                        }
                    } else {
                        try {
                            if (isNaN(params.typeOrSize) && !(InventoryType.valueOf(params.typeOrSize).isCreatable())) {
                                Bukkit.getLogger().warning("[CEActions] MANAGE_INVENTORY ACTION: Inventory type '" + params.typeOrSize + "' is not creatable.");
                                return;
                            }
                            if (!isNaN(params.typeOrSize) && (params.typeOrSize < 9 || params.typeOrSize > 54 || params.typeOrSize % 9 !== 0)) {
                                Bukkit.getLogger().warning("[CEActions] MANAGE_INVENTORY ACTION: Invalid inventory size.");
                                return;
                            }
                        } catch (e) {
                            Bukkit.getLogger().warning("[CEActions] MANAGE_INVENTORY ACTION: Invalid inventory type.");
                            return;
                        }
                        
                        invData = { "holder": parseInventoryHolder(params.holder, true), "typeOrSize": parseInt(params.typeOrSize) || InventoryType.valueOf(params.typeOrSize), "title": params.title || "Inventory" };
                        inv = Bukkit.createInventory(invData.holder, invData.typeOrSize, invData.title);
                        invData.constantType = inv.getType();
                    }
                    
                    inventoryMap[params.inventory] = {
                        holder: invData.holder,
                        typeOrSize: invData.typeOrSize,
                        constantType: invData.constantType,
                        title: invData.title,
                        contents: Material.matchMaterial(inv) ? null : Java.from(inv.getContents()).map(function(item) {
                            return item ? item.serialize() : null;
                        })
                    };
                    
                    if (temp) customTempInventories = inventoryMap;
                    else saveInventoriesFile(inventoryMap);
                    break;
                case "open":
                    if (!params.target) {
                        Bukkit.getLogger().warning("[CEActions] MANAGE_INVENTORY ACTION: Target player name is required.");
                        return;
                    }

                    var targetPlayer = Bukkit.getPlayer(params.target);
                    if (!targetPlayer) {
                        Bukkit.getLogger().warning("[CEActions] MANAGE_INVENTORY ACTION: Target player '" + params.target + "' not found or not online.");
                        return;
                    }
                    
                    function openInventory(inv, invType, invLoc, forceOpen) {
                        if (!params.fake || (params.fake && params.fake === "false")) {
                            switch (invType) {
                                case InventoryType.ANVIL:
                                case Material.ANVIL:
                                    if (targetPlayer.openAnvil) targetPlayer.openAnvil(invLoc, forceOpen);
                                    else if (inv) targetPlayer.openInventory(inv);
                                    break;
                                case InventoryType.CARTOGRAPHY:
                               	case Material.CARTOGRAPHY_TABLE:
                                    if (targetPlayer.openCartographyTable) targetPlayer.openCartographyTable(invLoc, forceOpen);
                                    else if (inv) targetPlayer.openInventory(inv);
                                    break;
                                case InventoryType.ENCHANTING:
                                case Material.ENCHANTING_TABLE:
                                    if (targetPlayer.openEnchanting) targetPlayer.openEnchanting(invLoc, forceOpen);
                                    else if (inv) targetPlayer.openInventory(inv);
                                    break;
                                case InventoryType.GRINDSTONE:
                                case Material.GRINDSTONE:
                                    if (targetPlayer.openGrindstone) targetPlayer.openGrindstone(invLoc, forceOpen);
                                    else if (inv) targetPlayer.openInventory(inv);
                                    break;
                                case InventoryType.LOOM:
                                case Material.LOOM:
                                    if (targetPlayer.openLoom) targetPlayer.openLoom(invLoc, forceOpen);
                                    else if (inv) targetPlayer.openInventory(inv);
                                    break;
                                case InventoryType.MERCHANT:
                                    if (targetPlayer.openMerchant && invLoc instanceof Merchant) targetPlayer.openMerchant(invLoc, forceOpen);
                                    else if (inv) targetPlayer.openInventory(inv);
                                    break;
                                case InventoryType.SMITHING:
                                case Material.SMITHING_TABLE:
                                    if (targetPlayer.openSmithingTable) targetPlayer.openSmithingTable(invLoc, forceOpen);
                                    else if (inv) targetPlayer.openInventory(inv);
                                    break;
                                case InventoryType.STONECUTTER:
                                case Material.STONECUTTER:
                                    if (targetPlayer.openStonecutter) targetPlayer.openStonecutter(invLoc, forceOpen);
                                    else if (inv) targetPlayer.openInventory(inv);
                                    break;
                                case InventoryType.WORKBENCH:
                                case Material.CRAFTING_TABLE:
                                case Material.WORKBENCH:
                                    if (targetPlayer.openWorkbench) targetPlayer.openWorkbench(invLoc, forceOpen);
                                    else if (inv) targetPlayer.openInventory(inv);
                                    break;
                                default:
                                    if (inv) targetPlayer.openInventory(inv);
                                    break;
                            }
                        } else {
                            if (inv) targetPlayer.openInventory(inv);
                        }
                    }
                    
					var inv = null;
                    if (params.owner) {
                        var opened = params.owner.startsWith("^");
                        var itemInventory = params.owner.split("|");
                        var itemSlot = null;
                        
                        try {
                        	itemSlot = itemInventory.length === 2 ? !isNaN(itemInventory[1]) ? parseInt(itemInventory[1]) : EquipmentSlot.valueOf(itemInventory[1]) : null;
                        } catch (e) {
                            itemSlot = null;
                        }
                        
                        var preParsedOwner = params.owner;
                        if (opened) preParsedOwner = params.owner.substring(1);
                        if (itemSlot != null) preParsedOwner = preParsedOwner.split("|")[0];
                        
                        var owner = parseInventoryHolder(preParsedOwner, false);
                        if (owner) {
                            function returnItemInventory(inventory, slot) {
                                if (slot != null) {
                                    try {
                                        var item = inventory.getItem(slot);
                                        var meta = item ? item.getItemMeta() : null;
                                        if (meta && meta instanceof BlockStateMeta && meta.hasBlockState()) {
                                            var state = meta.getBlockState();
                                            if (state && state.getInventory) return state.getInventory();
                                        }
                                    } catch (e) {
                                        return null;
                                    }
                                }
                                return null;
                            }
                            
                            if (opened && owner instanceof HumanEntity) {
                                inv = owner.getOpenInventory().getTopInventory();
                                inv = returnItemInventory(inv, itemSlot) || inv;
                            } else if (Material.matchMaterial(owner.material)) {
                                inv = owner.material;
                            } else {
                            	inv = owner.getInventory ? owner.getInventory() : null;
                                inv = returnItemInventory(owner.getInventory ? owner.getInventory() : owner.getEquipment(), itemSlot) || inv;
                            }
                            if (inv) {
                                if (inv.getSize && !(owner instanceof HumanEntity) && !(owner instanceof BlockInventoryHolder) && !(owner instanceof AbstractVillager) && (inv.getSize() < 9 || inv.getSize() > 54 || inv.getSize() % 9 !== 0)) {
                                    Bukkit.getLogger().warning("[CEActions] MANAGE_INVENTORY ACTION: Invalid owner's inventory size.");
                                } else {
                                    if (Material.matchMaterial(inv)) {
                                        var newInv = null;
                                        try {
                                        	newInv = Bukkit.createInventory(null, validMaterialsAndInventoriesMap[inv], params.title || "Inventory");
                                        } catch (e) {}
                                        openInventory(newInv, Material.matchMaterial(inv), owner.location, false);
                                    } else if (owner instanceof Merchant) {
                                        var merchant = Bukkit.createMerchant(owner.getName());
                                        merchant.setRecipes(owner.getRecipes());
                                        openInventory(null, InventoryType.MERCHANT, merchant, true);
                                    } else {
                                        if (!(inv.getType().isCreatable())) {
                                            Bukkit.getLogger().warning("[CEActions] MANAGE_INVENTORY ACTION: InventoryType '" + inv.getType() + "' is not creatable.");
                                            return;
                                        }
                                        targetPlayer.openInventory(inv);
                                    }
                                }
                            } else {
                                Bukkit.getLogger().warning("[CEActions] MANAGE_INVENTORY ACTION: Invalid inventory type.");
                            	return;
                            }
                            break;
                        }
                    }
					
                    var invData = null;
                    if (params.inventory) {
                    	invData = inventoryMap[params.inventory];
                        if (!invData) {
                            Bukkit.getLogger().warning("[CEActions] MANAGE_INVENTORY ACTION: Inventory ID '" + params.inventory + "' not found.");
                            return;
                        }
                        
                        var holder = parseInventoryHolder(invData.holder, false);
                        holder = holder && holder.getEquipment ? null : holder;
                        
						if (validInventoryTypes.indexOf(InventoryType.valueOf(invData.constantType)) !== -1) {
                            var newInv = null;
                            try {
                            	var newInv = Bukkit.createInventory(holder, validMaterialsAndInventoriesMap[invData.constantType], invData.title);
                            } catch (e) {}
                            openInventory(newInv, InventoryType.valueOf(invData.constantType), null, true);
                            break;
                        }
                        
                        if (!isNaN(invData.typeOrSize) && (invData.typeOrSize < 9 || invData.typeOrSize > 54 || invData.typeOrSize % 9 !== 0)) {
                            try {
                            	if (holder instanceof HumanEntity || InventoryType.valueOf(invData.constantType) === InventoryType.PLAYER) invData.typeOrSize = 45;
                                else {
                                    Bukkit.getLogger().warning("[CEActions] MANAGE_INVENTORY ACTION: Invalid inventory size.");
                                    break;
                                }
                            } catch (e) {
                                Bukkit.getLogger().warning("[CEActions] MANAGE_INVENTORY ACTION: Invalid inventory size.");
                                break;
                            }
                        }
                        
                        var size = invData.typeOrSize;
                        var contents = [], contentsPersist = true;

                        for (var i = 0; i < size; i++) {
                            contents[i] = null;
                        }

                        var raw = invData.contents;
                        for (var key in raw) {
                            if (!raw.hasOwnProperty(key)) continue;
                            var slot = parseInt(key, 10);
                            if (slot >= 0 && slot < size) {
                                if (raw[key]) contents[slot] = ItemStack.deserialize(raw[key]);
                            }
                        }
                    } else {
                        try {
                            if (isNaN(params.typeOrSize) && !(InventoryType.valueOf(params.typeOrSize).isCreatable())) {
                                Bukkit.getLogger().warning("[CEActions] MANAGE_INVENTORY ACTION: Inventory type '" + params.typeOrSize + "' is not creatable.");
                                return;
                            }
                            if (!isNaN(params.typeOrSize) && (params.typeOrSize < 9 || params.typeOrSize > 54 || params.typeOrSize % 9 !== 0)) {
                                Bukkit.getLogger().warning("[CEActions] MANAGE_INVENTORY ACTION: Invalid inventory size.");
                                return;
                            }
                        } catch (e) {
                            Bukkit.getLogger().warning("[CEActions] MANAGE_INVENTORY ACTION: Invalid inventory type.");
                            return;
                        }
                        
                        invData = { "holder": parseInventoryHolder(params.holder, false), "typeOrSize": parseInt(params.typeOrSize) || InventoryType.valueOf(params.typeOrSize), "title": params.title || "Inventory" };
                    }
                    
                    try {
                    	inv = Bukkit.createInventory(invData.holder, invData.typeOrSize, invData.title);
                    } catch (e) {
                        inv = Bukkit.createInventory(holder, invData.typeOrSize, invData.title);
                    }
                    invData.constantType = inv.getType();
                    
                    if (contentsPersist) inv.setContents(contents);
                    openInventory(inv, invData.typeOrSize, null, true);
                    break;
                case "delete":
                    if (inventoryMap[params.inventory]) {
                        delete inventoryMap[params.inventory];
                        if (temp) customTempInventories = inventoryMap;
                        else saveInventoriesFile(inventoryMap);
                    }
                    break;
                default:
                    Bukkit.getLogger().warning("[CEActions] MANAGE_INVENTORY ACTION: Unknown action '" + action + "'");
                    return;
            }
        }
    });

    var manageInventoryInstance = new ManageInventoryAction("manage_inventory");
    
    return manageInventoryInstance;
}

CEmanageInventory();
