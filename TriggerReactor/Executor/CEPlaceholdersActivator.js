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

var PlaceholderAPI = Java.type("me.clip.placeholderapi.PlaceholderAPI");
var PlaceholderExpansion = Java.type("me.clip.placeholderapi.expansion.PlaceholderExpansion");
var Player = Java.type("org.bukkit.entity.Player");
var Enchantment = Java.type("org.bukkit.enchantments.Enchantment");
var Entity = Java.type("org.bukkit.entity.Entity");
var LivingEntity = Java.type("org.bukkit.entity.LivingEntity");
var Sittable = Java.type("org.bukkit.entity.Sittable");
var HumanEntity = Java.type("org.bukkit.entity.HumanEntity");
var Damageable = Java.type("org.bukkit.entity.Damageable");
var Attributable = Java.type("org.bukkit.attribute.Attributable");
var Item = Java.type("org.bukkit.entity.Item");
var Vehicle = Java.type("org.bukkit.entity.Vehicle");
var Hanging = Java.type("org.bukkit.entity.Hanging");
var FallingBlock = Java.type("org.bukkit.entity.FallingBlock");
var TNTPrimed = Java.type("org.bukkit.entity.TNTPrimed");
var UUID = Java.type("java.util.UUID");
var Bukkit = Java.type("org.bukkit.Bukkit");
var Material = Java.type("org.bukkit.Material");
var essentialsPlugin = Bukkit.getPluginManager().getPlugin("Essentials");
var Location = Java.type("org.bukkit.Location");
var Collectors = Java.type("java.util.stream.Collectors");
var luckpermsPlugin = Bukkit.getPluginManager().getPlugin("LuckPerms");
var OfflinePlayer = Java.type("org.bukkit.OfflinePlayer");
var ItemMeta = Java.type("org.bukkit.inventory.meta.ItemMeta");
var ItemFlag = Java.type("org.bukkit.inventory.ItemFlag");
var EntityType = Java.type("org.bukkit.entity.EntityType");
var EquipmentSlot = Java.type("org.bukkit.inventory.EquipmentSlot");
var InventoryHolder = Java.type("org.bukkit.inventory.InventoryHolder");
var Attribute = Java.type("org.bukkit.attribute.Attribute");
var Projectile = Java.type("org.bukkit.entity.Projectile");
var NamespacedKey = Java.type("org.bukkit.NamespacedKey");
var PersistentDataType = Java.type("org.bukkit.persistence.PersistentDataType");
var itemsAdderPlugin = Bukkit.getPluginManager().getPlugin("ItemsAdder");
var oraxenPlugin = Bukkit.getPluginManager().getPlugin("Oraxen");
var nexoPlugin = Bukkit.getPluginManager().getPlugin("Nexo");
var DriverManager = Java.type("java.sql.DriverManager");
var SQLException = Java.type("java.sql.SQLException");
var Connection = Java.type("java.sql.Connection");
var PreparedStatement = Java.type("java.sql.PreparedStatement");
var Types = Java.type("java.sql.Types");
var Timestamp = Java.type("java.sql.Timestamp");
var Date = Java.type("java.sql.Date");
var pluginString = "TriggerReactor";
var plugin = Bukkit.getPluginManager().getPlugin(pluginString);

var customDataTempGlobalData = new java.util.HashMap();
var customDataTempTargetsData = new java.util.HashMap();

function CEPlaceholdersActivator() {
    var CEPlaceholders = Java.extend(PlaceholderExpansion, {
        persist: function() {
            return true;
        },

        canRegister: function() {
            return true;
        },

        getAuthor: function() {
            return "0ptifyne";
        },

        getIdentifier: function() {
            return "CEP";
        },

        getVersion: function() {
            return "1.3";
        },

        onPlaceholderRequest: function(player, identifier) {
            
            // ===================== ITEMS CHECKING FEATURES ===================== //
            
            if (identifier.startsWith("item_")) {
                var args = identifier.substring("item_".length).split("_");
                
                if (args.length < 1) return "InvalidArguments";
                
                var mode = args[0];
                var rawSlot = mode !== "handSlot" ? args[1].replaceAll("-", "_").toUpperCase().split("|") : null;
                var targetIdentifier = args[mode !== "handSlot" ? 2 : 1] && args[mode !== "handSlot" ? 2 : 1] !== "" ? args.slice(mode !== "handSlot" ? 2 : 1).join("_") : player.getName();
    
                var target = null;
                var inventory = null;
                var parts = targetIdentifier.split(",");
                
                if (parts.length === 4) {
                	try {
                        var world = Bukkit.getWorld(parts[0]);
                        var x = parseFloat(parts[1]);
                        var y = parseFloat(parts[2]);
                        var z = parseFloat(parts[3]);

                        var state = world.getBlockAt(x, y, z).getState();

                        if (state && state instanceof InventoryHolder) {
                            target = state;
                            inventory = target.getInventory();
                        } else {
                            return "TargetBlockIsNotInventoryHolder";
                        }
                    } catch (e) {
                    	return "InvalidCoordinates";
                    }
                } else if (targetIdentifier.length === 36) {
                    try {
                        var uuid = UUID.fromString(targetIdentifier);
                        var entity = Bukkit.getEntity(uuid);
                        
                        if (entity) {
                            target = entity;
                            inventory = target.getInventory ? target.getInventory() : target.getEquipment();
                        }
                    } catch (e) {
                        return "InvalidEntity";
                    }
                } else {
                    var onlinePlayer = Bukkit.getPlayer(targetIdentifier);
                    
                    if (onlinePlayer) {
                    	target = onlinePlayer;
                        inventory = target.getInventory();
                    } else {
                    	return "InvalidPlayer";
                    }
                }

                if (!target) return "InvalidTarget";
                if (!inventory) return "InvalidTargetInventory";
                
                if (mode === "handSlot") return inventory.getHeldItemSlot ? inventory.getHeldItemSlot() : "MainHand";
				
                var opened = rawSlot && rawSlot.length > 1 && rawSlot[0] === "OPENED";
                var slotExact = rawSlot ? opened ? rawSlot[1] : rawSlot[0] : 0;
                var slotIndex = !isNaN(slotExact) ? parseInt(slotExact) : slotExact;
                var item = null;
                        
                if (slotIndex === "CURSOR") item = target.getItemOnCursor ? target.getItemOnCursor() : null;
                if (opened && target instanceof HumanEntity) inventory = target.getOpenInventory().getTopInventory();
                
                try {
                    item = !isNaN(slotIndex) ? inventory.getItem(slotIndex) : inventory.getItem(EquipmentSlot.valueOf(slotIndex));
                } catch (e) {
                    return "InvalidSlot";
                }
                
                if (!item || item.getType().isAir()) return "ItemNotFound";
				
                if (mode.startsWith("lore")) {
                    var meta = item.getItemMeta();
                    if (!meta || !meta.hasLore()) return "None";
                    var lore = meta.getLore().toArray();
                    var selectedLore = "";
                    
                    if (mode.indexOf(":") !== -1) {
                        var args = mode.split(":");
                        var indexArg = args[1];
                        var indexes = indexArg.split(",");

                        for (var j = 0; j < indexes.length; j++) {
                            var index = parseInt(indexes[j]);
                            if (!isNaN(index) && index >= 0 && index < lore.length) {
                                selectedLore += lore[index] + "\n";
                            }
                        }
                    } else {
                        var loreText = "";
                        for (var i = 0; i < lore.length; i++) {
                            loreText += lore[i] + "\n";
                        }
                        return loreText.trim();
                    }

                    return selectedLore.trim() || "InvalidIndex";
                }
                
                if (mode.startsWith("enchantment") && !mode.startsWith("enchantments")) {
                    if (mode.indexOf(":") === -1) return "InvalidEnchantment";
                    var enchantmentString = mode.split(":")[1].replaceAll("-", "_");
                    if (!enchantmentString) return "InvalidEnchantment";
                    var enchantment = Enchantment.getByName(enchantmentString.toUpperCase());
                    return enchantment && item.containsEnchantment(enchantment) ? item.getEnchantmentLevel(enchantment) : "0";
                }
                
                if (mode.startsWith("dataContainer-")) {
                    if (!item.hasItemMeta()) return "None";
                    var meta = item.getItemMeta();
                    var data = meta.getPersistentDataContainer();
                    var parts = mode.split(":");

                    if ((mode.startsWith("dataContainer-value") || mode.startsWith("dataContainer-type")) && parts.length < 3) return "NotEnoughData";
                    if (mode.startsWith("dataContainer-all") && parts.length < 2) return "NotEnoughData";

                    var name = parts[1];
                    
                    var storedTypes = [
                    	PersistentDataType.STRING, PersistentDataType.INTEGER, PersistentDataType.FLOAT, PersistentDataType.DOUBLE,
						PersistentDataType.LONG, PersistentDataType.BYTE, PersistentDataType.SHORT, PersistentDataType.BOOLEAN,
						PersistentDataType.BYTE_ARRAY, PersistentDataType.INTEGER_ARRAY, PersistentDataType.LONG_ARRAY
                   ];
                    var storedStringTypes = [
                    	"STRING", "INTEGER", "FLOAT", "DOUBLE",
						"LONG", "BYTE", "SHORT", "BOOLEAN",
						"BYTE_ARRAY", "INTEGER_ARRAY", "LONG_ARRAY"
                   ];
                    
                    try {
                        if (mode.startsWith("dataContainer-all")) {
                            var keys = data.getKeys();
                            var foundData = [];

                            keys.forEach(function (key) {
                                if (key.getNamespace() === name) {
                                    var output = null;
                                    for (var i = 0; i < storedTypes.length; i++) {
                                        try {
                                            output = data.get(key, storedTypes[i]);
                                            if (output !== null) break;
                                        } catch (e) {}
                                    }
                                    if (output instanceof Java.type("int[]") || output instanceof Java.type("long[]") || output instanceof Java.type("byte[]")) {
                                        output = Java.from(output);
                                    }

                                    foundData.push(key.getKey() + ": " + output);
                                }
                            });

                            return foundData.length > 0 ? foundData.join(" | ") : "None";
                        } else if (mode.startsWith("dataContainer-value")) {
                            var id = parts[2];

                            var key = new NamespacedKey(name, id);
                            var output = null;
                            for (var i = 0; i < storedTypes.length; i++) {
                            	try {
                                	output = data.get(key, storedTypes[i]);
                                	if (output !== null) {
                                        if (output instanceof Java.type("int[]") || output instanceof Java.type("long[]") || output instanceof Java.type("byte[]")) {
                                            output = Java.from(output);
                                        }
                                        return output;
                                        break;
                                    }
                                } catch (e) {}
                            }
                            return "None";
                        } else if (mode.startsWith("dataContainer-type")) {
                            var id = parts[2];

                            var key = new NamespacedKey(name, id);
                            var output = null;
                            for (var i = 0; i < storedTypes.length; i++) {
                            	try {
                                	output = data.get(key, storedTypes[i]);
                                	if (output !== null) {
                                        return storedStringTypes[i];
                                        break;
                                    }
                                } catch (e) {}
                            }
                            return "None";
                        }
                    } catch (e) {
                        return "None";
                    }
                }
                
                switch (mode) {
                    case "enchantments":
                        var enchantments = item.getEnchantments();
                        if (!enchantments || enchantments.isEmpty()) return "None";
                        var enchantmentList = [];
                        var keys = enchantments.keySet().toArray();
                        for (var i = 0; i < keys.length; i++) {
                            var entry = keys[i];
                            enchantmentList.push(entry.getKey().getKey().toUpperCase() + "=" + enchantments.get(entry));
                        }
                        return enchantmentList.join(", ");
                    case "maxDurability":
                        return item.getType().getMaxDurability();
                    case "currentDurability":
                        var meta = item.getItemMeta();
                        return meta.hasDamage() ? (item.getType().getMaxDurability() - meta.getDamage()) : item.getType().getMaxDurability();
                    case "amount":
                        return item.getAmount();
                    case "name":
                        var meta = item.getItemMeta();
                        return meta.hasDisplayName() ? meta.getDisplayName() : "";
                    case "flags":
                        var meta = item.getItemMeta();
                        if (!meta) return "None";
                        var flags = meta.getItemFlags();
                        if (!flags || flags.isEmpty()) return "None";
                        var flagList = [];
                        var flagArray = flags.toArray();
                        for (var i = 0; i < flagArray.length; i++) {
                            flagList.push(flagArray[i].toString());
                        }
                        return flagList.join(", ");
                    case "material":
                        return item.getType().toString();
                    case "customModelData":
                        var meta = item.getItemMeta();
                        return meta.hasCustomModelData() ? meta.getCustomModelData() : "None";
                    case "itemsAdder":
                        if (!itemsAdderPlugin) {
                        	return "[CEPlaceholders] ITEM PLACEHOLDER: ItemsAdder plugin is not supported because it is not installed!";
                        } else {
            				var itemsAdderStack = Java.type("dev.lone.itemsadder.api.CustomStack");
                        	return itemsAdderStack.byItemStack(item) ? itemsAdderStack.byItemStack(item) : "No";
                        }
                    case "oraxen":
                        if (!oraxenPlugin) {
                        	return "[CEPlaceholders] ITEM PLACEHOLDER: Oraxen plugin is not supported because it is not installed!";
                        } else {
            				var oraxenStack = Java.type("io.th0rgal.oraxen.api.OraxenItems");
                        	return oraxenStack.getIdByItem(item) ? oraxenStack.getIdByItem(item) : "No";
                        }
					case "nexo":
                        if (!nexoPlugin) {
                        	return "[CEPlaceholders] ITEM PLACEHOLDER: Nexo plugin is not supported because it is not installed!";
                        } else {
            				var nexoStack = Java.type("com.nexomc.nexo.api.NexoItems");
                        	return nexoStack.idFromItem(item) ? nexoStack.idFromItem(item) : "No";
                        }
                    case "maxStack":
                        return item.getMaxStackSize ? item.getMaxStackSize() : "None";
                    default:
                        return "InvalidArguments";
                }
            }
            
            // ===================== LUCKPERMS PERMISSIONS WITH CONTEXTS ===================== //
            
            if (identifier.startsWith("lp_has_permission_in_contexts_") || identifier.startsWith("lp_get_permission_contexts_")) {
                if (!luckpermsPlugin) {
                	return "[CEPlaceholders] LP PLACEHOLDER: Placeholder was skipped because LuckPerms plugin is missing!";
            	} else {
                    var LuckPerms = Java.type("net.luckperms.api.LuckPerms");
                    var MutableContextSet = Java.type("net.luckperms.api.context.MutableContextSet");
                    var QueryOptions = Java.type("net.luckperms.api.query.QueryOptions");
                    var UserManager = Java.type("net.luckperms.api.model.user.UserManager");
                    var PlayerAdapter = Java.type("net.luckperms.api.platform.PlayerAdapter");
                    var PermissionNode = Java.type("net.luckperms.api.node.types.PermissionNode");
                    var parts, has;
                    if (identifier.startsWith("lp_has_permission_in_contexts_")) {
                        var parts = identifier.substring("lp_has_permission_in_contexts_".length).split("_");
                        has = true;
                    } else if (identifier.startsWith("lp_get_permission_contexts_")) {
                        var parts = identifier.substring("lp_get_permission_contexts_".length).split("_");
                        has = false;
                    }

                    if (parts.length < 3 && has) return "InvalidArguments";

                    if (parts.length >= 2) {
                        var playerOrGroup = parts.slice(0, parts.length - 2).join("_");
                        var permission = parts[parts.length - 2].replaceAll("ᵕ", "_");
                        var contextString = parts[parts.length - 1] ? parts[parts.length - 1].replaceAll("ᵕ", "_") : null;

                        var luckPerms = Bukkit.getServicesManager().getRegistration(LuckPerms.class).getProvider();

                        function getPlayerContexts(player) {
                            var contextManager = luckPerms.getContextManager();
                            var contexts = contextManager.getContextForPlayer(player);
                            return contexts;
                        }

                        function getContextsForPermission(target, permission, contextString, isGroup) {
                            var contextsForPermission = [];
                            var requestedContexts = contextString ? contextString.split(",") : [];

                            function processNodes(nodes) {
                                var iterator = nodes.iterator();
                                while (iterator.hasNext()) {
                                    var node = iterator.next();
                                    if (node instanceof PermissionNode && node.getPermission().equals(permission) && node.getValue()) {
                                        var contexts = node.getContexts();

                                        if (requestedContexts.length > 0) {
                                            for (var i = 0; i < requestedContexts.length; i++) {
                                                var requestedContext = requestedContexts[i].trim();
                                                if (!requestedContext) continue;

                                                var values = contexts.getValues(requestedContext);
                                                if (values != null && !values.isEmpty()) {
                                                    var valuesArray = [];
                                                    var valuesIterator = values.iterator();
                                                    while (valuesIterator.hasNext()) {
                                                        valuesArray.push(valuesIterator.next());
                                                    }
                                                    contextsForPermission.push(requestedContext + "=" + valuesArray.join(", "));
                                                } else {
                                                    contextsForPermission.push(requestedContext + "=null");
                                                }
                                            }
                                        } else {
                                            var allContexts = contexts.toSet();
                                            var allIterator = allContexts.iterator();
                                            while (allIterator.hasNext()) {
                                                var context = allIterator.next();
                                                contextsForPermission.push(context.getKey() + "=" + context.getValue());
                                            }
                                        }
                                    }
                                }
                            }

                            if (isGroup) {
                                var group = luckPerms.getGroupManager().getGroup(target);
                                if (group != null) {
                                    processNodes(group.getNodes());
                                }
                            } else {
                                var userManager = luckPerms.getUserManager();
                                var user = userManager.getUser(target);

                                if (user == null) {
                                    var future = userManager.loadUser(target);
                                    user = future.join();
                                }

                                if (user != null) {
                                    processNodes(user.getNodes());
                                }
                            }

                            return contextsForPermission.length > 0 ? contextsForPermission.join(", ") : "No contexts found";
                        }

                        function hasPermissionWithContexts(target, permission, contextString, isGroup) {
                            var contextSet = MutableContextSet.create();

                            var contextsArray = contextString.split(",");
                            for (var i = 0; i < contextsArray.length; i++) {
                                var parts = contextsArray[i].split("=");
                                if (parts.length === 2) {
                                    contextSet.add(parts[0], parts[1].trim());
                                }
                            }

                            if (isGroup) {
                                var group = luckPerms.getGroupManager().getGroup(target);
                                if (group != null) {
                                    var nodes = group.getNodes();
                                    var iterator = nodes.iterator();
                                    while (iterator.hasNext()) {
                                        var node = iterator.next();
                                        if (node instanceof PermissionNode && node.getPermission().equals(permission) && node.getValue() && node.getContexts().equals(contextSet)) {
                                            return true;
                                        }
                                    }
                                }
                            } else {
                                var userManager = luckPerms.getUserManager();
                                var user = userManager.getUser(target);

                                if (user == null) {
                                    try {
                                        var offlinePlayer = Bukkit.getOfflinePlayer(target);
                                        var future = userManager.loadUser(offlinePlayer.getUniqueId());
                                        user = future.join();
                                    } catch (e) {
                                        return "PlayerNotFound";
                                    }
                                }

                                if (user != null) {
                                    var nodes = user.getNodes();
                                    var iterator = nodes.iterator();
                                    while (iterator.hasNext()) {
                                        var node = iterator.next();
                                        if (node instanceof PermissionNode && node.getPermission().equals(permission) && node.getValue() && node.getContexts().equals(contextSet)) {
                                            return true;
                                        }
                                    }
                                }
                            }

                            return false;
                        }

                        var isGroup = false;

                        if (playerOrGroup.startsWith("group-")) {
                            playerOrGroup = playerOrGroup.substring(6);
                            isGroup = true;
                        }

                        var result = has ? hasPermissionWithContexts(playerOrGroup, permission, contextString, isGroup) : getContextsForPermission(playerOrGroup, permission, contextString, isGroup);

                        if (has) {
                            return result ? "true" : "false";
                        } else {
                            return result;
                        }
                    }

                    return "InvalidArguments";
                }
            }
            
            // ===================== HIGHEST BLOCK IN LOCATION ===================== //
            
            if (identifier.startsWith("highestBlock_player_")) {
                var playerName = identifier.substring("highestBlock_player_".length());
                var playerNameEndIndex = playerName.lastIndexOf("_");
                if (playerNameEndIndex !== -1) {
                    playerName = playerName.substring(0, playerNameEndIndex);
                }
                    
                var targetPlayer = playerName === "" ? player : Bukkit.getPlayer(playerName);
                if (targetPlayer != null) {
                    var targetLocation = targetPlayer.getLocation();
                    var targetWorld = targetLocation.getWorld();
                        
                    if (identifier.endsWith("_type")) {
                        return targetWorld.getHighestBlockAt(targetLocation).getType().toString();
                    } else {
                        return targetWorld.getHighestBlockYAt(targetLocation);
                    }
                } else {
                    return "PlayerNotFound";
                }
            }
            
            if (identifier.startsWith("highestBlock_uuid_")) {
                var uuidString = identifier.substring("highestBlock_uuid_".length());
                if (uuidString === "") return "InvalidUUID";
                var entity = Bukkit.getEntity(UUID.fromString(uuidString));
                if (entity != null) {
                    var entitylocation = entity.getLocation();
                    var entityWorld = entitylocation.getWorld();
                        
                    if (identifier.endsWith("_type")) {
                        return entityWorld.getHighestBlockAt(entitylocation).getType().toString();
                    } else {
                        return entityWorld.getHighestBlockYAt(entitylocation);
                    }
                } else {
                    return "EntityNotFound";
                }
            }
            
            if (identifier.startsWith("highestBlock_coords_")) {
                var location = identifier.substring("highestBlock_coords_".length()).split(",");
                if (location.length < 3) return "InvalidLocation";
                var locationEndIndex = location.lastIndexOf("_");
                if (locationEndIndex !== -1) {
                    location = location.substring(0, locationEndIndex);
                }
                var worldName = location[0];
                var x = parseInt(location[1]);
                var z = parseInt(location[2]);
                var world = Bukkit.getWorld(worldName);
                    
                if (world != null && !isNaN(x) && !isNaN(z)) {
                    if (identifier.endsWith("_type")) {
                        return world.getHighestBlockAt(x, z).getType().toString();
                    } else {
                        return world.getHighestBlockYAt(x, z);
                    }
                } else {
                    return "LocationNotFound";
                }
            }
            
            // ===================== RANDOM BLOCK IN AREA ===================== //
            
            if (identifier.startsWith("randomBlock_")) {
                var blocksIndex = identifier.indexOf("blocks=");

                var parts = [];
                if (blocksIndex !== -1) {
                    parts = identifier.substring("randomBlock_".length, blocksIndex).split("_");
                } else {
                    parts = identifier.substring("randomBlock_".length).split("_");
                }

                if (parts.length >= 8) {
                    var worldName, minX, minY, minZ, maxX, maxY, maxZ;
					
                    if (!parseInt(parts[parts.length - 10]) && parts.length == 17) {
                        worldName = parts[parts.length - 17].replaceAll("ᵕ", "_");
                        minX = parseInt(parts[parts.length - 16]);
                        minY = parseInt(parts[parts.length - 15]);
                        minZ = parseInt(parts[parts.length - 14]);
                        maxX = parseInt(parts[parts.length - 13]);
                        maxY = parseInt(parts[parts.length - 12]);
                        maxZ = parseInt(parts[parts.length - 11]);
                    } else if (!parseInt(parts[parts.length - 9]) && parts.length == 16) {
                        worldName = parts[parts.length - 16].replaceAll("ᵕ", "_");
                        minX = parseInt(parts[parts.length - 15]);
                        minY = parseInt(parts[parts.length - 14]);
                        minZ = parseInt(parts[parts.length - 13]);
                        maxX = parseInt(parts[parts.length - 12]);
                        maxY = parseInt(parts[parts.length - 11]);
                        maxZ = parseInt(parts[parts.length - 10]);
                    } else if (!parseInt(parts[parts.length - 8]) && parts.length == 15) {
                        worldName = parts[parts.length - 15].replaceAll("ᵕ", "_");
                        minX = parseInt(parts[parts.length - 14]);
                        minY = parseInt(parts[parts.length - 13]);
                        minZ = parseInt(parts[parts.length - 12]);
                        maxX = parseInt(parts[parts.length - 11]);
                        maxY = parseInt(parts[parts.length - 10]);
                        maxZ = parseInt(parts[parts.length - 9]);
                    } else if (!parseInt(parts[parts.length - 7]) && parts.length == 14) {
                        worldName = parts[parts.length - 14].replaceAll("ᵕ", "_");
                        minX = parseInt(parts[parts.length - 13]);
                        minY = parseInt(parts[parts.length - 12]);
                        minZ = parseInt(parts[parts.length - 11]);
                        maxX = parseInt(parts[parts.length - 10]);
                        maxY = parseInt(parts[parts.length - 9]);
                        maxZ = parseInt(parts[parts.length - 8]);
                    } else if (!parseInt(parts[parts.length - 6]) && parts.length == 13) {
                        worldName = parts[parts.length - 13].replaceAll("ᵕ", "_");
                        minX = parseInt(parts[parts.length - 12]);
                        minY = parseInt(parts[parts.length - 11]);
                        minZ = parseInt(parts[parts.length - 10]);
                        maxX = parseInt(parts[parts.length - 9]);
                        maxY = parseInt(parts[parts.length - 8]);
                        maxZ = parseInt(parts[parts.length - 7]);
                    } else if (!parseInt(parts[parts.length - 5]) && parts.length == 12) {
                        worldName = parts[parts.length - 12].replaceAll("ᵕ", "_");
                        minX = parseInt(parts[parts.length - 11]);
                        minY = parseInt(parts[parts.length - 10]);
                        minZ = parseInt(parts[parts.length - 9]);
                        maxX = parseInt(parts[parts.length - 8]);
                        maxY = parseInt(parts[parts.length - 7]);
                        maxZ = parseInt(parts[parts.length - 6]);
                    } else if (!parseInt(parts[parts.length - 4]) && parts.length == 11) {
                        worldName = parts[parts.length - 11].replaceAll("ᵕ", "_");
                        minX = parseInt(parts[parts.length - 10]);
                        minY = parseInt(parts[parts.length - 9]);
                        minZ = parseInt(parts[parts.length - 8]);
                        maxX = parseInt(parts[parts.length - 7]);
                        maxY = parseInt(parts[parts.length - 6]);
                        maxZ = parseInt(parts[parts.length - 5]);
                    } else if (!parseInt(parts[parts.length - 3]) && parts.length == 10) {
                        worldName = parts[parts.length - 10].replaceAll("ᵕ", "_");
                        minX = parseInt(parts[parts.length - 9]);
                        minY = parseInt(parts[parts.length - 8]);
                        minZ = parseInt(parts[parts.length - 7]);
                        maxX = parseInt(parts[parts.length - 6]);
                        maxY = parseInt(parts[parts.length - 5]);
                        maxZ = parseInt(parts[parts.length - 4]);
                    } else if (!parseInt(parts[parts.length - 2]) && parts.length == 9) {
                        worldName = parts[parts.length - 9].replaceAll("ᵕ", "_");
                        minX = parseInt(parts[parts.length - 8]);
                        minY = parseInt(parts[parts.length - 7]);
                        minZ = parseInt(parts[parts.length - 6]);
                        maxX = parseInt(parts[parts.length - 5]);
                        maxY = parseInt(parts[parts.length - 4]);
                        maxZ = parseInt(parts[parts.length - 3]);
                    } else if (!parseInt(parts[parts.length - 1]) && parts.length == 8) {
                        worldName = parts[parts.length - 8].replaceAll("ᵕ", "_");
                        minX = parseInt(parts[parts.length - 7]);
                        minY = parseInt(parts[parts.length - 6]);
                        minZ = parseInt(parts[parts.length - 5]);
                        maxX = parseInt(parts[parts.length - 4]);
                        maxY = parseInt(parts[parts.length - 3]);
                        maxZ = parseInt(parts[parts.length - 2]);
                    }

                    var world = Bukkit.getWorld(worldName);
                    if (world != null && !isNaN(minX) && !isNaN(minY) && !isNaN(minZ) &&
                        !isNaN(maxX) && !isNaN(maxY) && !isNaN(maxZ)) {

                        var includeSolid = identifier.indexOf("_solid") !== -1;
                        var includeFluid = identifier.indexOf("_fluid") !== -1;
                        var excludeAir = identifier.indexOf("_!air") !== -1;
                        var highestOffset = identifier.indexOf("_highest") !== -1;
                        if (highestOffset) {
                            var match = identifier.match(/highest([+-]?\d+)/);
                            if (match) {
                                highestOffset = parseInt(match[1], 10);
                            }
                        }
                        
                        var blockList = [];

                        if (identifier.indexOf("blocks=") !== -1) {
                            var blockString = identifier.split("blocks=")[1];
                            if (blockString.indexOf(";") !== -1) {
                                blockString = blockString.split(";")[0];
                            }
                            blockList = blockString.split(",").map(function(item) { return item.trim(); });
                        }
                        
                        var blockDataList = [];
                        
                        if (identifier.indexOf("block-data=") !== -1) {
                            var blockDataString = identifier.split("block-data=")[1].replaceAll("ᵕ", "_");
                            if (blockDataString.indexOf(";") !== -1) {
                                blockDataString = blockDataString.split(";")[0];
                            }
                            blockDataList = blockDataString.split("|").map(function(item) { return item.trim(); });
                        }
                        
                        var coordsList = parseCoordsList(identifier);

                        var validBlocks = [];

                        var startX = Math.min(minX, maxX);
                        var endX = Math.max(minX, maxX);
                        var startY = Math.min(minY, maxY);
                        var endY = Math.max(minY, maxY);
                        var startZ = Math.min(minZ, maxZ);
                        var endZ = Math.max(minZ, maxZ);

                        var excludedCoords = [];
                        var includedCoords = [];

                        for (var i = 0; i < coordsList.length; i++) {
                            var c = coordsList[i];
                            if (c.negate) {
                                excludedCoords.push(c);
                            } else {
                                includedCoords.push(c);
                            }
                        }

                        function isExcluded(x, y, z, worldName) {
                            for (var i = 0; i < excludedCoords.length; i++) {
                                var coord = excludedCoords[i];
                                if (coord.world === worldName &&
                                    x >= coord.minX && x <= coord.maxX &&
                                    y >= coord.minY && y <= coord.maxY &&
                                    z >= coord.minZ && z <= coord.maxZ) {
                                    return true;
                                }
                            }
                            return false;
                        }

                        for (var x = startX; x <= endX; x++) {
                            for (var y = startY; y <= endY; y++) {
                                for (var z = startZ; z <= endZ; z++) {
                                    if (isExcluded(x, y, z, world.getName())) continue;

                                    var block = world.getBlockAt(x, y, z);
                                    if (isValidBlock(block, includeSolid, includeFluid, excludeAir, blockList, blockDataList, highestOffset)) {
                                        validBlocks.push(block);
                                    }
                                }
                            }
                        }

                        for (var i = 0; i < includedCoords.length; i++) {
                            var coord = includedCoords[i];
                            var coordWorld = Bukkit.getWorld(coord.world);
                            if (!coordWorld) continue;

                            for (var x = coord.minX; x <= coord.maxX; x++) {
                                for (var y = coord.minY; y <= coord.maxY; y++) {
                                    for (var z = coord.minZ; z <= coord.maxZ; z++) {
                                        var block = coordWorld.getBlockAt(x, y, z);
                                        validBlocks.push(block);
                                    }
                                }
                            }
                        }

                        if (validBlocks.length === 0) return "NoValidBlocks";

                        var block = validBlocks[Math.floor(Math.random() * validBlocks.length)];

                        var result = [];
                        if (identifier.indexOf("_type") !== -1) result.push(block.getType().toString());
                        if (identifier.indexOf("_world") !== -1) result.push(block.getWorld().getName().toString());
                        if (identifier.indexOf("_x") !== -1) result.push(block.getX());
                        if (identifier.indexOf("_y") !== -1) result.push(block.getY());
                        if (identifier.indexOf("_z") !== -1) result.push(block.getZ());

                        return result.join(",");
                    }
                }
                return "InvalidArgument";
            }
            
            function parseCoordsList(identifier) {
                var list = [];
                var match = identifier.match(/coords=([^;]*)/);
                if (!match) return list;

                var entries = match[1].split("|");
                entries.forEach(function(entry) {
                    var negate = entry.startsWith("!");
                    if (negate) entry = entry.substring(1);

                    var parts = entry.split("~");
                    if (parts.length === 1) {
                        var single = parts[0].split(",");
                        if (single.length === 4) {
                            list.push({
                                negate: negate,
                                world: single[0].replaceAll("ᵕ", "_"),
                                minX: parseInt(single[1]),
                                minY: parseInt(single[2]),
                                minZ: parseInt(single[3]),
                                maxX: parseInt(single[1]),
                                maxY: parseInt(single[2]),
                                maxZ: parseInt(single[3])
                            });
                        }
                    } else if (parts.length === 2) {
                        var from = parts[0].split(",");
                        var to = parts[1].split(",");
                        if (from.length === 4 && to.length === 3) {
                            list.push({
                                negate: negate,
                                world: from[0].replaceAll("ᵕ", "_"),
                                minX: Math.min(parseInt(from[1]), parseInt(to[0])),
                                minY: Math.min(parseInt(from[2]), parseInt(to[1])),
                                minZ: Math.min(parseInt(from[3]), parseInt(to[2])),
                                maxX: Math.max(parseInt(from[1]), parseInt(to[0])),
                                maxY: Math.max(parseInt(from[2]), parseInt(to[1])),
                                maxZ: Math.max(parseInt(from[3]), parseInt(to[2]))
                            });
                        }
                    }
                });
                return list;
            }

            function isValidBlock(block, includeSolid, includeFluid, excludeAir, blockList, blockDataList, highestOffset) {
                var type = block.getType().toString();
                var data = block.getBlockData().getAsString();
                var x = block.getX();
                var y = block.getY();
                var z = block.getZ();
                var highestY = world.getHighestBlockYAt(x, z);
                var targetY = highestOffset ? highestY + highestOffset : null;
                
                if (!includeSolid && !includeFluid && !excludeAir && blockList.length === 0 && blockDataList.length === 0 && !highestOffset) {
                    return true;
                }

                if (targetY !== null && y !== targetY) return false;
                if (excludeAir && type === "AIR") return false;

                var isFluid = block.isLiquid();
                var matchedByBlocks = false;
                var deniedByBlocks = false;

                for (var i = 0; i < blockList.length; i++) {
                    var entry = blockList[i].trim();
                    var negate = false;

                    if (entry.startsWith("!")) {
                        negate = true;
                        entry = entry.substring(1).trim();
                    }

                    var match = false;
                    if (entry.startsWith("contains ")) {
                        match = type.indexOf(entry.substring("contains ".length).trim()) !== -1;
                    } else if (entry.startsWith("startsWith ")) {
                        match = type.startsWith(entry.substring("startsWith ".length).trim());
                    } else if (entry.startsWith("endsWith ")) {
                        match = type.endsWith(entry.substring("endsWith ".length).trim());
                    } else {
                        match = type === entry;
                    }

                    if (match) {
                        if (negate) deniedByBlocks = true;
                        else matchedByBlocks = true;
                    }
                }

                var matchedByData = false;
                var deniedByData = false;

                for (var i = 0; i < blockDataList.length; i++) {
                    var entry = blockDataList[i].trim();
                    var negate = false;

                    if (entry.startsWith("!")) {
                        negate = true;
                        entry = entry.substring(1).trim();
                    }

                    var match = false;
                    if (entry.startsWith("contains ")) {
                        match = data.indexOf(entry.substring("contains ".length).trim()) !== -1;
                    } else if (entry.startsWith("startsWith ")) {
                        match = data.startsWith(entry.substring("startsWith ".length).trim());
                    } else if (entry.startsWith("endsWith ")) {
                        match = data.endsWith(entry.substring("endsWith ".length).trim());
                    } else {
                        match = data === entry;
                    }

                    if (match) {
                        if (negate) deniedByData = true;
                        else matchedByData = true;
                    }
                }

                if (deniedByBlocks || deniedByData) return false;

                var matchedPositive = false;

                if (includeSolid && !isFluid) matchedPositive = true;
                if (includeFluid && isFluid) matchedPositive = true;
                if (matchedByBlocks || matchedByData) matchedPositive = true;

                var anyFilterSpecified =
                    includeSolid || includeFluid ||
                    blockList.length > 0 || blockDataList.length > 0 || excludeAir || highestOffset !== null;

                if (anyFilterSpecified && !matchedPositive) return false;

                return true;
            }
            
            // ===================== BIOME BY COORDS ===================== //
            
            if (identifier.startsWith("biome_")) {
                var coords = identifier.substring("biome_".length).split("_");
                if (coords.length >= 4) {
                    var worldName = coords.slice(0, coords.length - 3).join("_");
                    var x = parseInt(coords[coords.length - 3]);
                    var y = parseInt(coords[coords.length - 2]);
                    var z = parseInt(coords[coords.length - 1]);

                    var world = Bukkit.getWorld(worldName);
                    if (world != null) {
                        return world.getBiome(x, y, z).toString();
                    } else {
                        return "InvalidWorld";
                    }
                }
                return "InvalidCoords";
            }
            
            // ===================== ENTITIES IN RADIUS ===================== //
            
            function getEntitiesInRadius(world, x, y, z, radius, include, filters) {
                var location = new Location(world, x, y, z);
                return world.getNearbyEntities(location, radius, radius, radius).stream()
                    .filter(function(entity) {
                    	if (filters.some(function(filter) {
                            var newFilter = filter.replaceAll("-", "_");
                            if (newFilter === "PLAYER" && newFilter === entity.getType().toString()) {
                            	if (include && entity == player) return true;
                            	if (!include && entity != player) return true;
                                return false;
                            }
                            if (entity.getBlockData) return newFilter === entity.getBlockData().getMaterial().toString();
                            return newFilter === entity.getType().toString();
                        })) return true;
                    	if (filters.some(function(filter) {
                            var newFilter = filter.replaceAll("-", "_");
                            if (entity.getBlockData) return newFilter.substring(1) === entity.getBlockData().getMaterial().toString() && newFilter.charAt(0) === "!";
                            return newFilter.substring(1) === entity.getType().toString() && newFilter.charAt(0) === "!";
                        })) return false;
                        if (filters.indexOf("players") !== -1 && entity instanceof Player) {
                            if (include && entity == player) return true;
                            if (!include && entity != player) return true;
                        }
                        if (filters.indexOf("mobs") !== -1 && entity instanceof LivingEntity && !(entity instanceof Player)) return true;
                        if (filters.indexOf("items") !== -1 && entity instanceof Item) return true;
                        if (filters.indexOf("vehicles") !== -1 && entity instanceof Vehicle) return true;
                        if (filters.indexOf("projectiles") !== -1 && entity instanceof Projectile) return true;
                    	if (filters.indexOf("hanging") !== -1 && entity instanceof Hanging) return true;
                    	if (filters.indexOf("falling") !== -1 && entity instanceof FallingBlock) return true;
                    	if (filters.indexOf("tnt") !== -1 && entity instanceof TNTPrimed) return true;
                        return false;
                    })
                    .collect(Collectors.toList());
            }
            
            function syncGetEntitiesInRadius(world, x, y, z, radius, include, filters) {
                if (Bukkit.isPrimaryThread()) {
                    return getEntitiesInRadius(world, x, y, z, radius, include, filters);
                }

                var result = new java.util.concurrent.atomic.AtomicReference();
                var latch = new java.util.concurrent.CountDownLatch(1);

                var runnable = new java.lang.Runnable({
                    run: function () {
                        try {
                            result.set(getEntitiesInRadius(world, x, y, z, radius, include, filters));
                        } finally {
                            latch.countDown();
                        }
                    }
                });

                Bukkit.getScheduler().runTask(plugin, runnable);

                latch.await();
                return result.get();
            }

            if (identifier.startsWith("entitiesInRadius_")) {
                var args = identifier.substring("entitiesInRadius_".length).split("_");
                if (args.length < 7) return "InvalidArgs";
					
                var worldName = args.slice(0, args.length - 6).join("_");
                var x = parseFloat(args[args.length - 6]);
                var y = parseFloat(args[args.length - 5]);
                var z = parseFloat(args[args.length - 4]);
                var radius = parseFloat(args[args.length - 3]);
                var include = args[args.length - 2] === "true";
                if (player == null) include = false;
                var filters = args.slice(args.length - 1)[0].split(",");

                var world = Bukkit.getWorld(worldName);
                var entities = syncGetEntitiesInRadius(world, x, y, z, radius, include, filters);
                return entities.size() > 0 ? "true" : "false";
            }

            if (identifier.startsWith("entitiesCountInRadius_")) {
                var args = identifier.substring("entitiesCountInRadius_".length).split("_");
                if (args.length < 7) return "InvalidArgs";

                var worldName = args.slice(0, args.length - 6).join("_");
                var x = parseFloat(args[args.length - 6]);
                var y = parseFloat(args[args.length - 5]);
                var z = parseFloat(args[args.length - 4]);
                var radius = parseFloat(args[args.length - 3]);
                var include = args[args.length - 2] === "true";
                if (player == null) include = false;
                var filters = args.slice(args.length - 1)[0].split(",");
                
                var world = Bukkit.getWorld(worldName);
                var entities = syncGetEntitiesInRadius(world, x, y, z, radius, include, filters);
                return entities.size();
            }

            if (identifier.startsWith("entitiesListInRadius_")) {
                var args = identifier.substring("entitiesListInRadius_".length).split("_");
                if (args.length < 8) return "InvalidArgs";
				
                var worldName = args.slice(0, args.length - 7).join("_");
                var x = parseFloat(args[args.length - 7]);
                var y = parseFloat(args[args.length - 6]);
                var z = parseFloat(args[args.length - 5]);
                var radius = parseFloat(args[args.length - 4]);
                var attribute = args[args.length - 3];
                var include = args[args.length - 2] === "true";
                if (player == null) include = false;
                var filters = args.slice(args.length - 1)[0].split(",");

                var world = Bukkit.getWorld(worldName);
                var entities = syncGetEntitiesInRadius(world, x, y, z, radius, include, filters);

                if (attribute == "uuid") {
                    return entities.stream()
                        .map(function(e) { return e.getUniqueId().toString(); })
                        .collect(Collectors.joining(","));
                }
                if (attribute == "type") {
                    return entities.stream()
                        .map(function(e) { return e.getType().name(); })
                        .collect(Collectors.joining(","));
                }
                if (attribute == "type,type") {
                    return entities.stream()
                        .map(function(e) { return e.getBlockData ? e.getBlockData().getMaterial().name() : e.getType().name(); })
                        .collect(Collectors.joining(","));
                }
                if (attribute == "enum") {
                    return entities.stream()
                        .map(function(e) { return e.toString(); })
                        .collect(Collectors.joining(","));
                }
                if (attribute == "name") {
                    return entities.stream()
                        .map(function(e) { return e.getName ? e.getName() : "Unknown"; })
                        .collect(Collectors.joining(","));
                }
                if (attribute == "coords") {
                    return entities.stream()
                        .map(function(e) { return e.getWorld().getName() + ";" + e.getLocation().getX() + ";" + e.getLocation().getY() + ";" + e.getLocation().getZ(); })
                        .collect(Collectors.joining(","));
                }

                return "InvalidAttribute";
            }

            if (identifier.startsWith("entityAtIndexInRadius_")) {
                var args = identifier.substring("entityAtIndexInRadius_".length).split("_");
                if (args.length < 9) return "InvalidArgs";
				
                var worldName = args.slice(0, args.length - 8).join("_");
                var x = parseFloat(args[args.length - 8]);
                var y = parseFloat(args[args.length - 7]);
                var z = parseFloat(args[args.length - 6]);
                var radius = parseFloat(args[args.length - 5]);
                var index = parseInt(args[args.length - 4]);
                var attribute = args[args.length - 3];
                var include = args[args.length - 2] === "true";
                if (player == null) include = false;
                var filters = args.slice(args.length - 1)[0].split(",");

                var world = Bukkit.getWorld(worldName);
                var entities = syncGetEntitiesInRadius(world, x, y, z, radius, include, filters);

                if (index < 0 || index >= entities.size()) return "OutOfBounds";
                var entity = entities.get(index);

                if (attribute == "uuid") return entity.getUniqueId().toString();
                if (attribute == "type") return entity.getType().name();
                if (attribute == "type,type") return entity.getBlockData ? entity.getBlockData().getMaterial().name() : entity.getType().name();
                if (attribute == "enum") return entity.toString();
                if (attribute == "name") return entity.getName ? entity.getName() : "Unknown";
                if (attribute == "coords") return entity.getWorld().getName() + ";" + entity.getLocation().getX() + ";" + entity.getLocation().getY() + ";" + entity.getLocation().getZ();

                return "InvalidAttribute";
            }
            
            // ===================== ARRAY PROCESSING FEATURES ===================== //
            
            if (identifier.startsWith("array_")) {
                var args = identifier.substring("array_".length).split("_");
                if (args.length < 3) return "InvalidParameters";

                var separator = args[0];
                var operation = args[1].toUpperCase();
                var array = null;

                var startIndex = 0;
                var endIndex = 0;
                var value = null;
                var newValue = null;

                switch (operation) {
                    case "GET":
                        array = args.slice(2).join("_").split(separator);
                        return array.join(separator);
                    case "GET-PART":
                        if (args.length < 5) return "InvalidParameters";
                        array = args.slice(2, args.length - 2).join("_").split(separator);
                        startIndex = parseInt(args[args.length - 2]);
                        endIndex = parseInt(args[args.length - 1]);
                        startIndex = Math.max(0, Math.min(startIndex, array.length - 1));
                        endIndex = Math.max(0, Math.min(endIndex, array.length - 1));
                        if (startIndex > endIndex) {
                            var temp = startIndex;
                            startIndex = endIndex;
                            endIndex = temp;
                        }
                        return array.slice(startIndex, endIndex + 1).join(separator);
                    case "GET-BY-INDEX":
                        if (args.length < 4) return "InvalidParameters";
                        array = args.slice(2, args.length - 1).join("_").split(separator);
                        startIndex = parseInt(args[args.length - 1]);
                        return array[startIndex] || "";
                    case "GET-COUNT-BY-VALUE":
                        if (args.length < 4) return "InvalidParameters";
                        array = args.slice(2, args.length - 1).join("_").split(separator);
                        value = args[args.length - 1].replaceAll("ᵕ", "_");
                        var count = 0;
                        for (var i = 0; i < array.length; i++) {
                            if (array[i] === value) count++;
                        }
                        return count.toString();
                    case "GET-INDEXES-BY-VALUE":
                        if (args.length < 4) return "InvalidParameters";
                        array = args.slice(2, args.length - 1).join("_").split(separator);
                        value = args[args.length - 1].replaceAll("ᵕ", "_");
                        var indexes = [];
                        for (var i = 0; i < array.length; i++) {
                            if (array[i] === value) indexes.push(i);
                        }
                        return indexes.join(separator);
                    case "GET-LENGTH":
                        var rawArray = args.slice(2).join("_");
                        array = rawArray ? rawArray.split(separator) : [];
                        return array.length.toString();
                    case "CHECK":
                        if (args.length < 4) return "InvalidParameters";
                        array = args.slice(2, args.length - 1).join("_").split(separator);
                        value = args[args.length - 1].replaceAll("ᵕ", "_");
                        return value ? (array.indexOf(value) !== -1 ? "true" : "false") : "false";
                    case "ADD-BY-INDEX":
                        if (args.length < 5) return "InvalidParameters";
                        array = args.slice(2, args.length - 2).join("_").split(separator);
                        startIndex = parseInt(args[args.length - 2]);
                        value = args[args.length - 1].replaceAll("ᵕ", "_");
                        array.splice(startIndex, 0, value);
                        return array.join(separator);
                    case "SET-BY-INDEX":
                        if (args.length < 5) return "InvalidParameters";
                        array = args.slice(2, args.length - 2).join("_").split(separator);
                        startIndex = parseInt(args[args.length - 2]);
                        value = args[args.length - 1].replaceAll("ᵕ", "_");
                        array[startIndex] = value;
                        return array.join(separator);
                    case "SET-BY-VALUE":
                        if (args.length < 5) return "InvalidParameters";
                        array = args.slice(2, args.length - 2).join("_").split(separator);
                        value = args[args.length - 2].replaceAll("ᵕ", "_");
                        newValue = args[args.length - 1].replaceAll("ᵕ", "_");
                        if (value && newValue) {
                            for (var i = 0; i < array.length; i++) {
                                if (array[i] === value) array[i] = newValue;
                            }
                        }
                        return array.join(separator);
                    case "SET-RANGE":
                        if (args.length < 6) return "InvalidParameters";
                        array = args.slice(2, args.length - 3).join("_").split(separator);
                        startIndex = parseInt(args[args.length - 3]);
                        endIndex = parseInt(args[args.length - 2]);
                        startIndex = Math.max(0, Math.min(startIndex, array.length - 1));
                        endIndex = Math.max(0, Math.min(endIndex, array.length - 1));
                        if (startIndex > endIndex) {
                            var temp = startIndex;
                            startIndex = endIndex;
                            endIndex = temp;
                        }
                        value = args[args.length - 1].replaceAll("ᵕ", "_");
                        if (value) {
                            for (var i = startIndex; i <= endIndex; i++) {
                                array[i] = value;
                            }
                        }
                        return array.join(separator);
                    case "REMOVE-BY-INDEX":
                        if (args.length < 4) return "InvalidParameters";
                        array = args.slice(2, args.length - 1).join("_").split(separator);
                        startIndex = parseInt(args[args.length - 1]);
                        array.splice(startIndex, 1);
                        return array.join(separator);
                    case "REMOVE-BY-VALUE":
                        if (args.length < 4) return "InvalidParameters";
                        array = args.slice(2, args.length - 1).join("_").split(separator);
                        value = args[args.length - 1].replaceAll("ᵕ", "_");
                        var newArray = [];
                        for (var i = 0; i < array.length; i++) {
                            if (array[i] !== value) newArray.push(array[i]);
                        }
                        array = newArray;
                        return array.join(separator);
                    case "REMOVE-RANGE":
                        if (args.length < 5) return "InvalidParameters";
                        array = args.slice(2, args.length - 2).join("_").split(separator);
                        startIndex = parseInt(args[args.length - 2]);
                        endIndex = parseInt(args[args.length - 1]);
                        startIndex = Math.max(0, Math.min(startIndex, array.length - 1));
                        endIndex = Math.max(0, Math.min(endIndex, array.length - 1));
                        if (startIndex > endIndex) {
                            var temp = startIndex;
                            startIndex = endIndex;
                            endIndex = temp;
                        }
                        array.splice(startIndex, endIndex - startIndex + 1);
                        return array.join(separator);
                    default:
                        return "InvalidAction";
                }
            }
            
            // ===================== GET REAL NAME FROM ESSENTIALS CUSTOM NAME ===================== //
            
            if (identifier.startsWith("realname")) {
                if (!essentialsPlugin) {
                	return "[CEPlaceholders] REALNAME PLACEHOLDER: Placeholder was skipped because EssentialsX plugin is missing!";
            	} else {
            		var FormatUtil = Java.type("com.earth2me.essentials.utils.FormatUtil");
                    var foundUser = false;
                    var target = null;

                    if (!identifier.startsWith("realname_")) {
                        foundUser = true;
                        target = player;
                    } else {
                        var lookup = identifier.substring("realname_".length).toLowerCase();
                        var onlinePlayers = Bukkit.getOnlinePlayers();
                        for (var i = 0; i < onlinePlayers.size(); i++) {
                            var currentPlayer = onlinePlayers.get(i);
                            var displayName = FormatUtil.stripFormat(currentPlayer.getDisplayName()).toLowerCase();
                            var name = FormatUtil.stripFormat(currentPlayer.getName()).toLowerCase();
                            if (lookup.equalsIgnoreCase(displayName) || lookup.equalsIgnoreCase(name)) {
                                foundUser = true;
                                target = currentPlayer;
                                break;
                            }
                        }
                    }

                    if (foundUser && target != null) {
                        return target.getName();
                    } else {
                        return "PlayerNotFound";
                    }
                }
            }
            
            // ===================== WORKING WITH TEAMS ===================== //
            
            if (identifier.startsWith("team_")) {
                var parts = identifier.substring("team_".length).split("_");
                if (parts.length < 2) return "InvalidArguments";

                var target = parts.slice(0, parts.length - 1).join("_");
                var action = parts[parts.length - 1];

                var scoreboard = Bukkit.getScoreboardManager().getMainScoreboard();
                var team = scoreboard.getTeam(target);

                if (team == null) {
                    var entity;
                    try {
                        entity = Bukkit.getEntity(UUID.fromString(target));
                    } catch (e) {
                        entity = null;
                    }
                    if (entity != null) {
                        team = scoreboard.getEntryTeam(entity.getUniqueId().toString());
                    }
                }

                if (team == null) {
                    var player = Bukkit.getPlayer(target);
                    if (player != null) {
                        team = scoreboard.getEntryTeam(player.getName());
                    }
                }

                if (team == null) return "NotInTeam";

                switch (action) {
                    case "name":
                        return team.getName();
                    case "size":
                        return team.getSize().toString();
                    case "members":
                        var members = [];
                        var iterator = team.getEntries().iterator();
                        while (iterator.hasNext()) {
                            members.push(iterator.next());
                        }
                        return members.join(", ");
                    case "color":
                        return team.getColor() ? team.getColor().name() : "NONE";
                    case "prefix":
                        return team.getPrefix();
                    case "suffix":
                        return team.getSuffix();
                    case "visibility":
                        return team.getOption(org.bukkit.scoreboard.Team.Option.NAME_TAG_VISIBILITY).name();
                    case "collision":
                        return team.getOption(org.bukkit.scoreboard.Team.Option.COLLISION_RULE).name();
                    default:
                        return "UnknownAction";
                }
            }
                        
            // ===================== WORKING WITH CUSTOM DATA ===================== //
            
            if (identifier.startsWith("customData_")) {
                var args = identifier.substring("customData_".length).split("_");
                var temp = args[0].startsWith("temp");
                var action = temp ? args[0].substring("temp".length) : args[0];
                var name = args[1];
                var data = (action === "set" || action === "getset") && args[2] ? args[2].replaceAll("ᵕ", "_") : null;
                var targetIdentifier = args[action === "set" || action === "getset" ? 3 : 2] && args[action === "set" || action === "getset" ? 3 : 2] !== "" ? args.slice(action === "set" || action === "getset" ? 3 : 2).join("_") : null;
                
                if ((action === "set" || action === "getset") && !data) return "InvalidData";
				
                function createData(json, name, data, target) {
                    function isEmptyPlainObject(value) {
                        return (
                            typeof value === 'object' &&
                            value !== null &&
                            !Array.isArray(value) &&
                            Object.keys(value).length === 0
                        );
                    }
                     
                    if (!json.CEAAPP) json.CEAAPP = {};
                    if (!json.CEAAPP.CEPlaceholders) json.CEAAPP.CEPlaceholders = {};
                    if (!json.CEAAPP.CEPlaceholders.CustomDataPlaceholder) json.CEAAPP.CEPlaceholders.CustomDataPlaceholder = {};

                    if (!target) {
                        if (!json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.GlobalData) {
                            json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.GlobalData = {};
                        }

                        if (!json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.GlobalData[name]) {
                            json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.GlobalData[name] = {};
                        }

                        if (isEmptyPlainObject(json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.GlobalData[name]) &&
                            !data) {
                            json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.GlobalData[name] = null;
                        }

                        if (data) {
                            json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.GlobalData[name] = data;
                        }

                    } else {
                        if (!json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.TargetsData) {
                            json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.TargetsData = {};
                        }

                        if (!json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.TargetsData[target]) {
                            json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.TargetsData[target] = {};
                        }

                        if (!json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.TargetsData[target][name]) {
                            json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.TargetsData[target][name] = {};
                        }

                        if (isEmptyPlainObject(json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.TargetsData[target][name]) &&
                            !data) {
                            json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.TargetsData[target][name] = null;
                        }

                        if (data) {
                            json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.TargetsData[target][name] = data;
                        }
                    }

                    return json;
                }
                
                function loadData(file) {
                    var fileReader = new java.util.Scanner(file);
                    var jsonContent = fileReader.useDelimiter("\\Z").next();
                    fileReader.close();
                    return JSON.parse(jsonContent);
                }

                function saveData(file, json) {
                    var writer = new java.io.FileWriter(file, false);
                    writer.write(JSON.stringify(json, null, 2));
                    writer.close();
                }
                
                if (!targetIdentifier) {
                    switch (action) {
                        case "set":
                            if (temp) {
                            	customDataTempGlobalData.put(name, data);
                            } else {
                                var file = new java.io.File("plugins/TriggerReactor/var.json");
                                var json = {};

                                if (file.exists()) {
                                    json = loadData(file);
                                } else {
                                    return "plugins/TriggerReactor/var.json not found";
                                }
								
                                json = createData(json, name, data, null);
                                
                                saveData(file, json);
                            }
                            return data;
                        case "get":
                            if (temp) {
                            	return customDataTempGlobalData.get(name) || "NoData";
                            } else {
                                var file = new java.io.File("plugins/TriggerReactor/var.json");
                                var json = {};

                                if (file.exists()) {
                                    json = loadData(file);
                                } else {
                                    return "plugins/TriggerReactor/var.json not found";
                                }
								
                                json = createData(json, name, null, null);
                                
                                return json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.GlobalData[name] || "NoData";
                            }
                        case "getset":
                            if (temp) {
                                var output = customDataTempGlobalData.get(name);
                                if (output) {
                                    return output;
                                } else {
                            		customDataTempGlobalData.put(name, data);
                                    return data;
                                }
                            } else {
                                var file = new java.io.File("plugins/TriggerReactor/var.json");
                                var json = {};

                                if (file.exists()) {
                                    json = loadData(file);
                                } else {
                                    return "plugins/TriggerReactor/var.json not found";
                                }
                                json = createData(json, name, null, null);
								
                                var output = json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.GlobalData[name];
                                if (output) {
                                    return output;
                                } else {
                            		json = createData(json, name, data, null);
                                	
                                    saveData(file, json);
                                    return data;
                                }
                            }
                        case "remove":
                            if (temp) {
                            	return customDataTempGlobalData.remove(name) ? true : false;
                            } else {
                                var file = new java.io.File("plugins/TriggerReactor/var.json");
                                var json = {};

                                if (file.exists()) {
                                    json = loadData(file);
                                } else {
                                    return "plugins/TriggerReactor/var.json not found";
                                }
								
                                json = createData(json, name, null, null);
                                
                                var output = json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.GlobalData[name];
                                if (output) {
                                	delete json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.GlobalData[name];
                                	saveData(file, json);
                                    return true;
                                }
                                return false;
                            }
                        default:
                            return "InvalidAction";
                    }
                } else {
                    var target = null;
                    if (targetIdentifier.indexOf(",") !== -1) {
                        var parts = targetIdentifier.split(",");
                        if (parts.length === 4) {
                            var world = Bukkit.getWorld(parts[0]);
                            var x = parseFloat(parts[1]);
                            var y = parseFloat(parts[2]);
                            var z = parseFloat(parts[3]);
                            
                            try {
                            	target = world.getBlockAt(x, y, z);
                            } catch (e) {
                                return "InvalidLocation";
                            }
                        } else {
                            return "InvalidLocation";
                        }
                    } else {
                        try {
                            var uuid = UUID.fromString(targetIdentifier);
                            var entity = Bukkit.getEntity(uuid);
                            target = entity ? uuid : null;
                        } catch (e) {
                            target = Bukkit.getOfflinePlayer(targetIdentifier);
                        }
                        
                        if (!target) return "InvalidTarget";
                    }
                    
                    switch (action) {
                        case "set":
                            if (temp) {
                                var targetData = customDataTempTargetsData.get(target) || new java.util.HashMap();
                                targetData.put(name, data);
                                customDataTempTargetsData.put(target, targetData);
                            } else {
                                var file = new java.io.File("plugins/TriggerReactor/var.json");
                                var json = {};

                                if (file.exists()) {
                                    json = loadData(file);
                                } else {
                                    return "plugins/TriggerReactor/var.json not found";
                                }

                                json = createData(json, name, data, target);

                                saveData(file, json);
                            }
                            return data;
                        case "get":
                            if (temp) {
                                return customDataTempTargetsData.get(target) && customDataTempTargetsData.get(target).get(name) ? customDataTempTargetsData.get(target).get(name) : "NoData";
                            } else {
                                var file = new java.io.File("plugins/TriggerReactor/var.json");
                                var json = {};

                                if (file.exists()) {
                                    json = loadData(file);
                                } else {
                                    return "plugins/TriggerReactor/var.json not found";
                                }

                                return json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.TargetsData[target] && json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.TargetsData[target][name] ? json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.TargetsData[target][name] : "NoData";
                            }
                        case "getset":
                            if (temp) {
                                var targetData = customDataTempTargetsData.get(target) || new java.util.HashMap();
                                var output = targetData.get(name);
                                if (output) {
                                    return output;
                                } else {
                            		targetData.put(name, data);
                                	customDataTempTargetsData.put(target, targetData);
                                    return data;
                                }
                            } else {
                                var file = new java.io.File("plugins/TriggerReactor/var.json");
                                var json = {};

                                if (file.exists()) {
                                    json = loadData(file);
                                } else {
                                    return "plugins/TriggerReactor/var.json not found";
                                }
                                json = createData(json, name, null, target);
                                
                                var output = json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.TargetsData[target][name];
                                if (output) {
                                    return output;
                                } else {
                            		json = createData(json, name, data, target);
                                	
                                    saveData(file, json);
                                    return data;
                                }
                            }
                        case "remove":
                            if (temp) {
                            	return customDataTempTargetsData.get(target) ? customDataTempTargetsData.get(target).remove(name) ? true : false : false;
                            } else {
                                var file = new java.io.File("plugins/TriggerReactor/var.json");
                                var json = {};

                                if (file.exists()) {
                                    json = loadData(file);
                                } else {
                                    return "plugins/TriggerReactor/var.json not found";
                                }
								
                                json = createData(json, name, null, target);
                                
                                var output = json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.TargetsData[target][name];
                                if (output) {
                                	delete json.CEAAPP.CEPlaceholders.CustomDataPlaceholder.TargetsData[target][name];
                                	saveData(file, json);
                                    return true;
                                }
                                return false;
                            }
                        default:
                            return "InvalidAction";
                    }
                }
            }
            
            // ===================== GET DIFFERENT ENTITY INFORMATION ===================== //
            
            if (identifier.startsWith("entity_")) {
				var args = identifier.substring("entity_".length).split("_");
                var action = args[0] || null;
                var targetIdentifier = args.length > 1 && args[1] !== "" ? args.slice(1).join("_") : player.getName();
				
                if (!action) return "InvalidAction";
                
                var target = null;
                try {
                    var uuid = UUID.fromString(targetIdentifier);
                    target = Bukkit.getEntity(uuid);
                } catch (e) {
                    target = Bukkit.getPlayer(targetIdentifier);
                }

                if (!target) return "EntityNotFound";
                
                if (action.startsWith("isOnFire")) {
                    var parts = action.split(":");
                    action = parts[0];
                    var state = parts[1];
                }
                
                if (action.startsWith("location")) {
                    var parts = action.split(":");
                    action = parts[0];
                    var coords = parts[1] ? parts[1].split(",") : null;
                }
                
                if (action.startsWith("passengers")) {
                    var parts = action.split(":");
                    action = parts[0];
                    var attribute = parts[1];
                }
                
                switch (action) {
                    case "type":
                        return target.getType().name();
                    case "name":
                        return target.getName ? target.getName() : "Unknown";
                    case "enum":
                        return target.toString();
                    case "maxAir":
                        if (target instanceof LivingEntity) {
                        	return target.getMaximumAir();
                        }
                        return "TargetIsNotLivingEntity";
                    case "currentAir":
                        if (target instanceof LivingEntity) {
                        	return target.getRemainingAir();
                        }
                        return "TargetIsNotLivingEntity";
                    case "walkSpeed":
                    	if (target instanceof Player) {
                        	return target.getWalkSpeed();
                        }
                        return "TargetIsNotPlayer";
                    case "flySpeed":
                    	if (target instanceof Player) {
                        	return target.getFlySpeed();
                        }
                        return "TargetIsNotPlayer";
                    case "ticksLived":
                    	return target.getTicksLived();
                    case "isGliding":
                        if (target instanceof LivingEntity) {
                        	return target.isGliding();
                        }
                        return "TargetIsNotLivingEntity";
                    case "isBlocking":
                        if (target instanceof HumanEntity) {
                        	return target.isBlocking();
                        }
                        return "TargetIsNotHumanEntity";
                    case "isHandRaised":
                        if (target instanceof HumanEntity) {
                        	return target.isHandRaised();
                        }
                        return "TargetIsNotHumanEntity";
                    case "currentHealth":
                        if (target instanceof Damageable) {
                            return target.getHealth().toFixed(2);
                        }
                        return "TargetIsNotDamageable";
                    case "maxHealth":
                        if (target instanceof Attributable) {
                            return target.getAttribute(Attribute.GENERIC_MAX_HEALTH).getValue().toFixed(2);
                        }
                        return "TargetIsNotAttributable";
                    case "isSwimming":
                        if (target instanceof LivingEntity) {
                            return target.isSwimming();
                        }
                        return "TargetIsNotLivingEntity";
                    case "isSitting":
                        if (target instanceof Sittable) {
                            return target.isSitting();
                        }
                        return "TargetIsNotSittable";
                    case "isInWater":
                        return target.isInWater();
                    case "isInLava":
                        var loc = target.getLocation();
    					var block = loc.getBlock();
    					var type = block.getType().toString();
    					return type.contains("LAVA");
                    case "isFrozen":
                        return target.isFrozen();
                    case "isOnFire":
                        switch (state) {
                            case "real":
                                return target.getFireTicks() > 0;
                            case "visual":
                                return target.isVisualFire();
                            default:
                        		return "InvalidState";    
                        }
                    case "fireTicks":
                        return target.getFireTicks();
                    case "location":
                        var output = [];
                        if (!coords) coords = ["world", "x", "y", "z"];
                        
                        coords.forEach(function(coord) {
                            switch (coord) {
                                case "world":
                                    output.push(target.getWorld().getName());
                                    break;
                                case "x":
                                    output.push(target.getLocation().getX());
                                    break;
                                case "y":
                                    output.push(target.getLocation().getY());
                                    break;
                                case "z":
                                    output.push(target.getLocation().getZ());
                                    break;
                                default:
                                    return "InvalidCoord";
                            }
                        });
                        
                        return output.join(";");
                    case "openInventory":
                        if (target instanceof HumanEntity) {
                        	return target.getOpenInventory().getType().toString();
                        }
                        return "TargetIsNotHumanEntity";
                    case "passengers":
                        var passengers = target.getPassengers();
                		if (passengers.length === 0) return "NoPassengers";
                        
                        var result = "";
                        for (var i = 0; i < passengers.length; i++) {
                            var p = passengers[i];
                            var value;
                            switch (attribute) {
                                case "uuid":
                                    value = p.getUniqueId().toString();
                                    break;
                                case "type":
                                    value = p.getType().name();
                                    break;
                                case "enum":
                                    value = p.toString();
                                    break;
                                case "name":
                                    value = p.getName ? p.getName() : "Unknown";
                                    break;
                                case "coords":
                                    value = p.getWorld().getName() + ";" + p.getLocation().getX() + ";" + p.getLocation().getY() + ";" + p.getLocation().getZ();
                                    break;
                                default:
                                    return "InvalidAttribute";
                            }
                            if (i > 0) {
                                result += ",";
                            }
                            result += value;
                        }
                        
                        return result;
                    default:
                        return "InvalidAction";
                }
            }
            
            // ===================== GET BLOCK LIGHT ===================== //
            
            if (identifier.startsWith("blockLight_")) {
				var args = identifier.substring("blockLight_".length).split("_");
                
                if (args.length < 5) return "InvalidArguments";
                
                var action = args[0].trim();
                var x = parseInt(args[1]);
                var y = parseInt(args[2]);
                var z = parseInt(args[3]);
                var worldName = args.slice(4).join("_");
				
                var world = null;
                try {
                    world = Bukkit.getWorld(worldName);
                } catch (e) {
                    return "InvalidWorld";
                }
                
                var location = null;
                try {
                    location = new Location(world, x, y, z);
                } catch (e) {
                    return "LocationNotFound";
                }
                
                var block = null;
                try {
                    block = location.getBlock();
                } catch (e) {
                    return "BlockNotFound";
                }
                
                switch (action) {
					case "fromBlocks":
                		return block.getLightFromBlocks();
                    case "fromSky":
                		return block.getLightFromSky();
                    case "default":
                		return block.getLightLevel();
                    default:
                        return "InvalidAction";
                }
            }
            
            // ===================== WORKING WITH MYSQL ===================== //
            
            if (identifier.startsWith("mysql_")) {
				var args = identifier.substring("mysql_".length).split("_");
                
                if (args.length < 2) return "InvalidArguments";
                
                var jdbcUrl = args[0].trim().replaceAll("ᵕ", "_").replaceAll("╵", "%");
            	var query = args[1].trim().replaceAll("ᵕ", "_").replaceAll("╵", "%");
                
                if (query.toLowerCase().startsWith("insert")) {
                	return "OnlySelectionIsAllowed";
                }
                
                var params = args.length >= 3 ? args[2].trim().replaceAll("ᵕ", "_").replaceAll("╵", "%").split(",") : [];
                
                function setAutoParam(stmt, index, val) {
                    try {
                        if (val.toLowerCase() === "null") {
                            stmt.setNull(index, Types.NULL);
                            return;
                        }
                        if (val === "true" || val === "false") {
                            stmt.setBoolean(index, val === "true");
                            return;
                        }
                        if (/^\d{13}$/.test(val)) {
                            stmt.setTimestamp(index, new Timestamp(java.lang.Long.parseLong(val)));
                            return;
                        }
                        if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
                            stmt.setDate(index, Date.valueOf(val));
                            return;
                        }
                        if (/^-?\d+$/.test(val)) {
                            var longVal = java.lang.Long.parseLong(val);
                            if (longVal >= -2147483648 && longVal <= 2147483647) {
                                stmt.setInt(index, parseInt(val));
                            } else {
                                stmt.setLong(index, longVal);
                            }
                            return;
                        }
                        if (/^-?\d+\.\d+$/.test(val)) {
                            stmt.setDouble(index, parseFloat(val));
                            return;
                        }
                        stmt.setString(index, val);
                    } catch (e) {
                        stmt.setString(index, val);
                    }
                }

                try {
                    try {
                        var conn = DriverManager.getConnection(jdbcUrl);
                    } catch (e) {
                        return "InvalidJDBCLink";
                    }

                    try {
                        var stmt = conn.prepareStatement(query);
                    } catch (e) {
                        return "InvalidQuery";
                    }

                    for (var i = 0; i < params.length; i++) {
                        setAutoParam(stmt, i + 1, params[i].trim());
                    }

                    var rs = stmt.executeQuery();
                    var meta = rs.getMetaData();
                    var columns = meta.getColumnCount();

                    var results = [];

                    while (rs.next()) {
                        var row = [];
                        for (var i = 1; i <= columns; i++) {
                            var val = rs.getString(i);
                            row.push(val !== null ? val : "null");
                        }
                        results.push(row.join(","));
                    }

                    rs.close();
                    stmt.close();
                    conn.close();

                    return results.length > 0 ? results.join(";") : "NoResult";

                } catch (e) {
                    e.printStackTrace();
                    if (e instanceof SQLException) {
                        return "SQLException: " + e.getMessage && e.getMessage() ? e.getMessage() : e.message;
                    } else {
                        return "Error: " + e.getMessage && e.getMessage() ? e.getMessage() : e.message;
                    }
                }
            }
            
            return null;
        }
    });

    var registerPlaceholderExpansion = function() {
        var expansion = new CEPlaceholders();
        PlaceholderAPI.registerExpansion(expansion);
    };

    registerPlaceholderExpansion();
}