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
var ArrayList = Java.type("java.util.ArrayList");
var LinkedHashMap = Java.type("java.util.LinkedHashMap");

var customTempInventories = new HashMap();

function toJsList(maybe){
    if (maybe == null) return [];
    try { if (maybe instanceof java.util.List) return Java.from(maybe); } catch(e){}
    try {
        if (maybe instanceof java.util.Map) {
            var keys = Java.from(maybe.keySet());
            keys.sort(function(a,b){
                var ai = parseInt(""+a,10), bi = parseInt(""+b,10);
                if (!isNaN(ai) && !isNaN(bi)) return ai - bi;
                return (""+a).localeCompare(""+b);
            });
            var out = [];
            for (var i=0;i<keys.length;i++) out.push(maybe.get(keys[i]));
            return out;
        }
    } catch(e){}
    try { return Java.from(maybe); } catch(e){}
    return [];
}

function getFromAny(obj, key, def){
    try {
        if (obj == null) return def;
        if (obj.containsKey && obj.containsKey(key)) return obj.get(key);
        if (obj.hasOwnProperty && obj.hasOwnProperty(key)) return obj[key];
        if (key in obj) return obj[key];
    } catch(e){}
    return def;
}

var gson = new GsonBuilder().setPrettyPrinting().create();
var INVENTORIES_FILE = new File("plugins/TriggerReactor/inventories.json");

var openableByBlockMaterial = {
    ANVIL: InventoryType.ANVIL,
    CARTOGRAPHY_TABLE: InventoryType.CARTOGRAPHY,
    ENCHANTING_TABLE: InventoryType.ENCHANTING,
    GRINDSTONE: InventoryType.GRINDSTONE,
    LOOM: InventoryType.LOOM,
    SMITHING_TABLE: InventoryType.SMITHING,
    STONECUTTER: InventoryType.STONECUTTER,
    CRAFTING_TABLE: InventoryType.WORKBENCH,
    WORKBENCH: InventoryType.WORKBENCH,
    FURNACE: InventoryType.FURNACE,
    BLAST_FURNACE: InventoryType.BLAST_FURNACE,
    SMOKER: InventoryType.SMOKER,
    BREWING_STAND: InventoryType.BREWING,
    HOPPER: InventoryType.HOPPER,
    DISPENSER: InventoryType.DISPENSER,
    DROPPER: InventoryType.DROPPER,
    BARREL: InventoryType.BARREL,
    SHULKER_BOX: InventoryType.SHULKER_BOX
};

function warn(msg) { Bukkit.getLogger().warning("[CEActions] MANAGE_INVENTORY ACTION: " + msg); }
function asBool(v, def) {
    if (v == null) return def;
    var s = ("" + v).toLowerCase();
    if (s === "true" || s === "yes" || s === "1") return true;
    if (s === "false" || s === "no" || s === "0") return false;
    return def;
}
function asInt(v) {
    if (v == null) return null;
    var n = parseInt(v, 10);
    return isNaN(n) ? null : n;
}
function asEnum(enumType, v) {
    if (!v) return null;
    try { return enumType.valueOf(("" + v).toUpperCase()); } catch (e) { return null; }
}
function chooseHolderForCreate(explicitHolder, owner, inv, target, fake) {
    if (fake && explicitHolder && explicitHolder instanceof InventoryHolder) return explicitHolder;

    if (fake) return null;

    if (owner && owner instanceof InventoryHolder) return owner;

    try {
        var ih = inv && inv.getHolder ? inv.getHolder() : null;
        if (ih && ih instanceof InventoryHolder) return ih;
    } catch (e) {}

    if (owner && owner.material && target && target instanceof InventoryHolder) return target;

    if (target && target instanceof InventoryHolder) return target;

    return null;
}
function storeHas(s, key) {
    try {
        if (s == null) return false;
        if (s.containsKey) return s.containsKey(key);
        if (s.hasOwnProperty) return s.hasOwnProperty(key);
        return (key in s);
    } catch (e) { return false; }
}
function storeGet(s, key) { try { return s.containsKey ? s.get(key) : s[key]; } catch (e) { return null; } }
function storePut(s, key, val) { try { if (s.put) s.put(key, val); else s[key] = val; } catch (e) {} }
function storeDel(s, key) { try { if (s.remove) s.remove(key); else delete s[key]; } catch (e) {} }

function itemToBase64(item) {
    if (item == null) return null;
    var baos = new ByteArrayOutputStream();
    var oos = new BukkitObjectOutputStream(baos);
    oos.writeObject(item);
    oos.close();
    return Base64.getEncoder().encodeToString(baos.toByteArray());
}
function itemFromBase64(b64) {
    if (!b64) return null;
    try {
        var data = Base64.getDecoder().decode(b64);
        var bais = new ByteArrayInputStream(data);
        var ois = new BukkitObjectInputStream(bais);
        var obj = ois.readObject();
        ois.close();
        return obj;
    } catch (e) { return null; }
}

function loadStore() {
    if (!INVENTORIES_FILE.exists()) return {};
    var br = new BufferedReader(new FileReader(INVENTORIES_FILE));
    var json = "", line;
    while ((line = br.readLine()) !== null) json += line;
    br.close();

    var raw = gson.fromJson(json, java.util.Map.class);
    var out = {};
    if (raw == null) return out;

    var keys = raw.keySet().toArray();
    for (var i = 0; i < keys.length; i++) {
        var k = keys[i];
        var v = raw.get(k);
        var sizeOrType = v.get("typeOrSize");
        var constType = v.get("constantType");
        var title = v.get("title");
        var holder = v.get("holder");
        var fake = v.get("fake");
        var fromItemContainer = v.get("fromItemContainer");
        var merchantRecipesObj = v.get("merchantRecipes");
        var merchantRecipes = null;
        if (merchantRecipesObj != null) {
            merchantRecipes = [];
            var list = toJsList(merchantRecipesObj);
            for (var mi = 0; mi < list.length; mi++) {
                var rec = list[mi];
                var ingrList = getFromAny(rec, "ingredients", []);
                var ingr = toJsList(ingrList);

                merchantRecipes.push({
                    result:           getFromAny(rec, "result", null),
                    ingredients:      ingr,
                    maxUses:          getFromAny(rec, "maxUses", 9999),
                    uses:             getFromAny(rec, "uses", 0),
                    demand:           getFromAny(rec, "demand", 0),
                    villagerXP:       getFromAny(rec, "villagerXP", 0),
                    expReward:        getFromAny(rec, "expReward", false),
                    specialPrice:     getFromAny(rec, "specialPrice", 0),
                    priceMultiplier:  getFromAny(rec, "priceMultiplier", 0.0),
                    ignoreDiscounts:  getFromAny(rec, "ignoreDiscounts", true)
                });
            }
        }

        var contentsObj = v.get("contents");
        var contents = null;
        if (contentsObj != null) {
            var sizeNum = null;
            try { sizeNum = java.lang.Integer.parseInt("" + sizeOrType); } catch (e) { sizeNum = null; }
            if (sizeNum == null) sizeNum = 54;
            contents = [];
            for (var z = 0; z < sizeNum; z++) contents[z] = null;

            var cKeys = contentsObj.keySet().toArray();
            for (var j = 0; j < cKeys.length; j++) {
                var slot = parseInt(cKeys[j], 10);
                if (!isNaN(slot) && slot >= 0 && slot < sizeNum) {
                    contents[slot] = itemFromBase64(contentsObj.get(cKeys[j]));
                }
            }
        }

        out[k] = {
            holder: holder,
            typeOrSize: sizeOrType,
            constantType: constType,
            title: title,
            contents: contents,
            merchantRecipes: merchantRecipes,
            fromItemContainer: (fromItemContainer === true),
            fake: (fake === true)
        };
    }
    return out;
}
function saveStore(store) {
    var toSave = {};
    for (var key in store) {
        if (!store.hasOwnProperty(key)) continue;
        var e = store[key];

        var contentsMap = {};
        if (e.contents && e.contents.length) {
            for (var i = 0; i < e.contents.length; i++) {
                var it = e.contents[i];
                if (it != null) contentsMap["" + i] = itemToBase64(it);
            }
        }
        
        var recipesList = null;
        if (e.merchantRecipes && e.merchantRecipes.length) {
            recipesList = new ArrayList();
            for (var ri = 0; ri < e.merchantRecipes.length; ri++) {
                var s = e.merchantRecipes[ri] || {};
                var m = new LinkedHashMap();
                var ingSrc = s.ingredients || [];
                var ingList = new ArrayList();
                for (var jj = 0; jj < ingSrc.length; jj++) ingList.add(ingSrc[jj]);

                m.put("result",          (s.result != null ? s.result : null));
                m.put("ingredients",     ingList);
                m.put("maxUses",         (s.maxUses != null ? s.maxUses : 9999));
                m.put("uses",            (s.uses != null ? s.uses : 0));
                m.put("demand",          (s.demand != null ? s.demand : 0));
                m.put("villagerXP",      (s.villagerXP != null ? s.villagerXP : 0));
                m.put("expReward",       (s.expReward === true));
                m.put("specialPrice",    (s.specialPrice != null ? s.specialPrice : 0));
                m.put("priceMultiplier", (s.priceMultiplier != null ? s.priceMultiplier : 0.0));
                m.put("ignoreDiscounts", (s.ignoreDiscounts !== false));
                recipesList.add(m);
            }
        }

        toSave[key] = {
            holder: e.holder,
            typeOrSize: e.typeOrSize,
            constantType: e.constantType,
            title: e.title,
            contents: contentsMap,
            merchantRecipes: recipesList,
            fromItemContainer: e.fromItemContainer === true,
            fake: e.fake === true
        };
    }
    var bw = new BufferedWriter(new FileWriter(INVENTORIES_FILE));
    gson.toJson(toSave, bw);
    bw.close();
}

function isValidChestSize(n) { return n >= 9 && n <= 54 && (n % 9 === 0); }
function normalizeChestSize(n) {
    if (n < 9) n = 9;
    if (n > 54) n = 54;
    if (n % 9 !== 0) n = Math.ceil(n / 9) * 9;
    return n;
}
function typeIsCreatableSafe(t) {
    try { return t != null && t.isCreatable(); } catch (e) { return false; }
}
function materialToInvTypeOrNull(mat) {
    if (!mat) return null;
    var name = ("" + mat).toUpperCase();
    return openableByBlockMaterial[name] || null;
}
function extractItemContainerInventory(invOrEquip, slot) {
    if (invOrEquip == null || slot == null) return null;
    try {
        var item = invOrEquip.getItem(slot);
        if (!item) return null;
        var meta = item.getItemMeta();
        if (meta && meta instanceof BlockStateMeta) {
            var state = meta.getBlockState();
            if (state && state.getInventory) return state.getInventory();
        }
    } catch (e) { }
    return null;
}

function cloneOrNull(it){ try { return it ? it.clone() : null; } catch(e){ return it; } }

function snapshotItemsFromInventory(inv){
    if (!inv) return [];
    try { return Java.from(inv.getContents()); } catch(e){ return []; }
}
function snapshotItemsFromSaved(saved){
    var out = [];
    if (!saved || !saved.contents) return out;
    for (var i=0;i<saved.contents.length;i++) out.push(saved.contents[i] ? saved.contents[i].clone() : null);
    return out;
}

function fillInventoryExactOrSequential(destInv, items, preferIndex){
    if (!destInv || !destInv.getSize) return false;
    var size = destInv.getSize();
    var list = new java.util.ArrayList();
    for (var i=0;i<size;i++) list.add(null);

    if (preferIndex) {
        var lim = Math.min(size, items.length);
        for (var i=0;i<lim;i++) list.set(i, cloneOrNull(items[i]));
    } else {
        var di = 0;
        for (var si=0; si<items.length && di<size; si++){
            var it = items[si]; if (it == null) continue;
            while (di < size && list.get(di) != null) di++;
            if (di >= size) break;
            list.set(di++, cloneOrNull(it));
        }
    }
    destInv.setContents(list.toArray(Java.to([], "org.bukkit.inventory.ItemStack[]")));
    return true;
}

function setItemContainerContentsInInventory(containerInv, slot, items, preferIndex){
    try{
        var item = containerInv.getItem(slot);
        if (!item) return false;
        var meta = item.getItemMeta();
        if (!meta || !(meta instanceof BlockStateMeta)) return false;
        var state = meta.getBlockState();
        if (!state || !state.getInventory) return false;
        var inner = state.getInventory();
        fillInventoryExactOrSequential(inner, items, preferIndex);
        meta.setBlockState(state);
        item.setItemMeta(meta);
        containerInv.setItem(slot, item);
        return true;
    } catch(e){ return false; }
}

function setItemContainerContentsInEquipment(equip, slot, items, preferIndex){
    try{
        var item = equip.getItem(slot);
        if (!item) return false;
        var meta = item.getItemMeta();
        if (!meta || !(meta instanceof BlockStateMeta)) return false;
        var state = meta.getBlockState();
        if (!state || !state.getInventory) return false;
        var inner = state.getInventory();
        fillInventoryExactOrSequential(inner, items, preferIndex);
        meta.setBlockState(state);
        item.setItemMeta(meta);
        equip.setItem(slot, item);
        return true;
    } catch(e){ return false; }
}

function applyToPlayerInventory(pInv, items, preferIndex, srcIsPlayerLike){
    try{
        var size = 36;
        var storage = new java.util.ArrayList();
        for (var i=0;i<size;i++) storage.add(null);

        if (preferIndex){
            var lim = Math.min(size, items.length);
            for (var i=0;i<lim;i++) storage.set(i, cloneOrNull(items[i]));
        } else {
            var di = 0;
            for (var si=0; si<items.length && di<size; si++){
                var it = items[si]; if (it == null) continue;
                while (di < size && storage.get(di) != null) di++;
                if (di >= size) break;
                storage.set(di++, cloneOrNull(it));
            }
        }
        pInv.setStorageContents(storage.toArray(Java.to([], "org.bukkit.inventory.ItemStack[]")));

        if (srcIsPlayerLike && items.length >= 41){
            try { pInv.setBoots(     cloneOrNull(items[36])); } catch(e){}
            try { pInv.setLeggings(  cloneOrNull(items[37])); } catch(e){}
            try { pInv.setChestplate(cloneOrNull(items[38])); } catch(e){}
            try { pInv.setHelmet(    cloneOrNull(items[39])); } catch(e){}
            try { if (pInv.setItemInOffHand) pInv.setItemInOffHand(cloneOrNull(items[40])); } catch(e){}
        }
        return true;
    } catch(e){ return false; }
}

function applyMerchantSnapshotToTarget(targetHolder, snapshot){
    try{
        if (!snapshot) return false;
        var built = buildMerchantFromSnapshot(snapshot, null);
        var recipes = built.merchant.getRecipes();
        if (targetHolder instanceof Merchant) { targetHolder.setRecipes(recipes); return true; }
        if (targetHolder instanceof AbstractVillager) { targetHolder.setRecipes(recipes); return true; }
    } catch(e){}
    return false;
}

function addItemsToInventory(inv, items){
    if (!inv || !inv.addItem) return false;
    var changed = false;
    for (var i=0;i<items.length;i++){
        var it = items[i]; if (!it) continue;
        try { inv.addItem(cloneOrNull(it)); changed = true; } catch(e){}
    }
    return changed;
}
function clearInventoryContents(inv){
    try { if (!inv) return false; inv.clear(); return true; } catch(e){ return false; }
}

function merchantRecipesFromSnapshot(snapshot){
    var MerchantRecipe = Java.type("org.bukkit.inventory.MerchantRecipe");
    var list = new java.util.ArrayList();
    if (!snapshot) return list;
    for (var i=0;i<snapshot.length;i++){
        var s = snapshot[i];
        var res = itemFromBase64(s.result);
        var mr = new MerchantRecipe(res, (s.maxUses!=null ? s.maxUses : 9999));
        var ings = [];
        var src = s.ingredients || [];
        for (var j=0;j<src.length;j++) ings.push(itemFromBase64(src[j]));
        try { mr.setIngredients(Java.to(ings, "java.util.List")); } catch(e){}
        try { mr.setUses(0); } catch(e){}
        try { mr.setDemand(s.demand || 0); } catch(e){}
        try { mr.setVillagerExperience(s.villagerXP || 0); } catch(e){}
        try { mr.setExperienceReward(!!s.expReward); } catch(e){}
        try { mr.setSpecialPrice(s.specialPrice || 0); } catch(e){}
        try { mr.setPriceMultiplier(s.priceMultiplier || 0.0); } catch(e){}
        try { mr.setIgnoreDiscounts(s.ignoreDiscounts !== false); } catch(e){}
        list.add(mr);
    }
    return list;
}

function applyMerchantSnapshotToTargetWithMode(targetHolder, snapshot, mode){
    try{
        if (!(targetHolder instanceof Merchant) && !(targetHolder instanceof AbstractVillager)) return false;
        if (mode === "clear"){
            targetHolder.setRecipes(Java.to([], "java.util.List"));
            return true;
        }
        var newOnes = merchantRecipesFromSnapshot(snapshot);
        if (mode === "add"){
            var merged = new java.util.ArrayList();
            try { Java.from(targetHolder.getRecipes() || []).forEach(function(r){ merged.add(r); }); } catch(e){}
            Java.from(newOnes).forEach(function(r){ merged.add(r); });
            targetHolder.setRecipes(merged);
        } else {
            targetHolder.setRecipes(newOnes);
        }
        return true;
    } catch(e){ return false; }
}

function mutateItemContainerInInventory(containerInv, slot, mode, items, preferIndex){
    try{
        var item = containerInv.getItem(slot);
        if (!item) return false;
        var meta = item.getItemMeta();
        if (!meta || !(meta instanceof BlockStateMeta)) return false;
        var state = meta.getBlockState();
        if (!state || !state.getInventory) return false;
        var inner = state.getInventory();
        if (mode === "clear") { clearInventoryContents(inner); }
        else if (mode === "add") { addItemsToInventory(inner, items); }
        else { fillInventoryExactOrSequential(inner, items, preferIndex); }
        meta.setBlockState(state);
        item.setItemMeta(meta);
        containerInv.setItem(slot, item);
        return true;
    } catch(e){ return false; }
}

function mutateItemContainerInEquipment(equip, slot, mode, items, preferIndex){
    try{
        var item = equip.getItem(slot);
        if (!item) return false;
        var meta = item.getItemMeta();
        if (!meta || !(meta instanceof BlockStateMeta)) return false;
        var state = meta.getBlockState();
        if (!state || !state.getInventory) return false;
        var inner = state.getInventory();
        if (mode === "clear") { clearInventoryContents(inner); }
        else if (mode === "add") { addItemsToInventory(inner, items); }
        else { fillInventoryExactOrSequential(inner, items, preferIndex); }
        meta.setBlockState(state);
        item.setItemMeta(meta);
        equip.setItem(slot, item);
        return true;
    } catch(e){ return false; }
}

function applyToMobEquipment(equip, items, mode, preferIndex, srcIsPlayerLike){
    if (!equip) return false;
    var cur = {
        main: equip.getItemInMainHand ? equip.getItemInMainHand() : null,
        off:  equip.getItemInOffHand  ? equip.getItemInOffHand()  : null,
        helm: equip.getHelmet         ? equip.getHelmet()         : null,
        chest:equip.getChestplate     ? equip.getChestplate()     : null,
        legs: equip.getLeggings       ? equip.getLeggings()       : null,
        boots:equip.getBoots          ? equip.getBoots()          : null
    };
    if (mode === "clear"){
        try{
            if (equip.setItemInMainHand) equip.setItemInMainHand(null);
            if (equip.setItemInOffHand)  equip.setItemInOffHand(null);
            if (equip.setHelmet)         equip.setHelmet(null);
            if (equip.setChestplate)     equip.setChestplate(null);
            if (equip.setLeggings)       equip.setLeggings(null);
            if (equip.setBoots)          equip.setBoots(null);
            return true;
        }catch(e){ return false; }
    }

    function getSrcByIndex(i){
        return (i >= 0 && i < items.length) ? (items[i] ? items[i].clone() : null) : null;
    }
    var src = {main:null,off:null,helm:null,chest:null,legs:null,boots:null};

    if (preferIndex){
        src.main  = getSrcByIndex(0);
        src.off   = getSrcByIndex(1);
        src.helm  = getSrcByIndex(2);
        src.chest = getSrcByIndex(3);
        src.legs  = getSrcByIndex(4);
        src.boots = getSrcByIndex(5);
    } else if (srcIsPlayerLike){
        src.helm  = getSrcByIndex(39);
        src.chest = getSrcByIndex(38);
        src.legs  = getSrcByIndex(37);
        src.boots = getSrcByIndex(36);
        src.off   = getSrcByIndex(40);
        for (var si=0; si<items.length; si++){ if (items[si]) { src.main = items[si].clone(); break; } }
    } else {
        var order = ["main","off","helm","chest","legs","boots"], si = 0;
        for (var oi=0; oi<order.length && si<items.length; oi++){
            while (si<items.length && !items[si]) si++;
            if (si>=items.length) break;
            src[order[oi]] = items[si++].clone();
        }
    }

    function put(slotName, val){
        if (slotName === "main"  && equip.setItemInMainHand) equip.setItemInMainHand(val);
        if (slotName === "off"   && equip.setItemInOffHand)  equip.setItemInOffHand(val);
        if (slotName === "helm"  && equip.setHelmet)         equip.setHelmet(val);
        if (slotName === "chest" && equip.setChestplate)     equip.setChestplate(val);
        if (slotName === "legs"  && equip.setLeggings)       equip.setLeggings(val);
        if (slotName === "boots" && equip.setBoots)          equip.setBoots(val);
    }
    function isEmpty(it){ return it == null || (it.getType && it.getType() === Material.AIR); }

    var changed = false;
    var keys = ["main","off","helm","chest","legs","boots"];
    for (var k=0;k<keys.length;k++){
        var name = keys[k], val = src[name];
        if (!val) continue;
        if (mode === "add"){
            if (isEmpty(cur[name])) { put(name, val); changed = true; }
        } else {
            put(name, val); changed = true;
        }
    }
    return changed;
}

function createVisualInventoryLike(inv, title, holderForCreate) {
    var t = (inv && inv.getType) ? inv.getType() : null;
    var size = (inv && inv.getSize) ? inv.getSize() : -1;

    if (t && (""+t) === (""+InventoryType.CHEST) && size > 0) {
        var norm = isValidChestSize(size) ? size : normalizeChestSize(size);
        return Bukkit.createInventory(holderForCreate, norm, title || (t && t.name ? t.name() : "Inventory"));
    }

    if (t && typeIsCreatableSafe(t)) {
        return Bukkit.createInventory(holderForCreate, t, title || (t && t.name ? t.name() : t.name()));
    }

    var base = (size > 0) ? size : 9;
    var norm2 = isValidChestSize(base) ? base : normalizeChestSize(base);
    return Bukkit.createInventory(holderForCreate, norm2, title || ((t && t.name) ? t.name() : "Inventory"));
}

function resolveHolder(identifier) {
    if (!identifier) return null;

    var p = Bukkit.getPlayer(identifier);
    if (p) return p;

    try {
        var uuid = java.util.UUID.fromString(identifier);
        var ent = Bukkit.getEntity(uuid);
        if (ent) return ent;
    } catch (e) { }

    if (identifier.indexOf(",") !== -1) {
        var parts = identifier.split(",");
        if (parts.length === 4) {
            var world = Bukkit.getWorld(parts[0]);
            var x = parseInt(parts[1], 10), y = parseInt(parts[2], 10), z = parseInt(parts[3], 10);
            if (world && !isNaN(x) && !isNaN(y) && !isNaN(z)) {
                var block = world.getBlockAt(x, y, z);
                if (block) {
                    var state = block.getState();
                    if (state && state instanceof InventoryHolder) return state;
                    var mat = block.getType();
                    var invType = materialToInvTypeOrNull(mat);
                    if (invType != null) {
                        return { material: ("" + mat), location: block.getLocation() };
                    }
                }
            }
        }
    }

    return null;
}
function holderIdForStore(holder) {
    if (holder == null) return null;
    try { if (holder.getUniqueId) return "" + holder.getUniqueId(); } catch (e) {}
    return null;
}

function buildMerchantFromHolder(holder, title, cloneRecipes) {
    var finalTitle = title || (holder && holder.getCustomName ? (holder.getCustomName() || "Merchant") : "Merchant");

    if (!cloneRecipes && (holder instanceof Merchant)) {
        return { merchant: holder, title: finalTitle, isOriginal: true };
    }

    var m = Bukkit.createMerchant(finalTitle);

    var sourceRecipes = null;
    if (holder instanceof Merchant && holder.getRecipes) {
        sourceRecipes = holder.getRecipes();
    } else if (holder instanceof AbstractVillager && holder.getRecipes) {
        sourceRecipes = holder.getRecipes();
    }

    if (cloneRecipes && sourceRecipes) {
        try {
            var MerchantRecipe = Java.type("org.bukkit.inventory.MerchantRecipe");
            var cloned = [];
            var arr = Java.from(sourceRecipes);
            for (var i = 0; i < arr.length; i++) {
                var r = arr[i];

                var result = r.getResult ? r.getResult().clone() : null;
                var ingr  = r.getIngredients ? Java.from(r.getIngredients()) : [];
                var ingrCloned = [];
                for (var j = 0; j < ingr.length; j++) {
                    ingrCloned.push(ingr[j] ? ingr[j].clone() : null);
                }

                var maxUses = r.getMaxUses ? r.getMaxUses() : 9999;
                var newR = new MerchantRecipe(result, maxUses);
                newR.setIngredients(Java.to(ingrCloned, "java.util.List"));
                try { newR.setUses(0); } catch (e) {}
                try { newR.setDemand(0); } catch (e) {}
                try { newR.setVillagerExperience(0); } catch (e) {}
                try { newR.setExperienceReward(false); } catch (e) {}
                try { newR.setSpecialPrice(0); } catch (e) {}
                try { newR.setPriceMultiplier(0.0); } catch (e) {}
                try { newR.setIgnoreDiscounts(true); } catch (e) {}

                cloned.push(newR);
            }
            m.setRecipes(Java.to(cloned, "java.util.List"));
        } catch (e) { }
    } else if (!cloneRecipes && sourceRecipes) {
        try { m.setRecipes(sourceRecipes); } catch (e) {}
    }

    return { merchant: m, title: finalTitle, isOriginal: false };
}

function tryGetOpenMerchant(invMaybe) {
	try { return (invMaybe && invMaybe.getMerchant) ? invMaybe.getMerchant() : null; } catch (e) { return null; }
}

function toLocKey(loc){
    try {
        if (!loc || !loc.getWorld) return null;
        return loc.getWorld().getName()+","+loc.getBlockX()+","+loc.getBlockY()+","+loc.getBlockZ();
    } catch(e){ return null; }
}
function holderKeyFromInventoryHolder(h){
    if (!h) return null;
    try { if (h.getUniqueId) return ""+h.getUniqueId(); } catch(e){}
    try {
        if (h.getBlock) {
            var b = h.getBlock();
            if (b) return toLocKey(b.getLocation());
        }
        if (h.getLocation) {
            var l = h.getLocation();
            var k = toLocKey(l);
            if (k) return k;
        }
    } catch(e){}
    return null;
}

function serializeMerchantRecipesFrom(merchantLike){
    try {
        var merch = null;
        if (merchantLike && merchantLike.getRecipes) merch = merchantLike;
        else {
            var m = tryGetOpenMerchant(merchantLike);
            if (m) merch = m;
        }
        if (!merch || !merch.getRecipes) return null;

        var arr = Java.from(merch.getRecipes());
        var out = [];
        for (var i=0;i<arr.length;i++){
            var r = arr[i];
            var ingr = r.getIngredients ? Java.from(r.getIngredients()) : [];
            var snapshot = {
                result: itemToBase64(r.getResult ? r.getResult() : null),
                ingredients: ingr.map(function(it){ return itemToBase64(it); }),
                maxUses: (r.getMaxUses ? r.getMaxUses() : 9999),
                uses: (r.getUses ? r.getUses() : 0),
                demand: (r.getDemand ? r.getDemand() : 0),
                villagerXP: (r.getVillagerExperience ? r.getVillagerExperience() : 0),
                expReward: (r.hasExperienceReward ? r.hasExperienceReward() : false),
                specialPrice: (r.getSpecialPrice ? r.getSpecialPrice() : 0),
                priceMultiplier: (r.getPriceMultiplier ? r.getPriceMultiplier() : 0.0),
                ignoreDiscounts: (r.shouldIgnoreDiscounts ? r.shouldIgnoreDiscounts() : true)
            };
            out.push(snapshot);
        }
        return out;
    } catch(e){ return null; }
}
function buildMerchantFromSnapshot(snapshot, title){
    var MerchantRecipe = Java.type("org.bukkit.inventory.MerchantRecipe");
    var m = Bukkit.createMerchant(title || "Merchant");
    if (!snapshot) return {merchant:m,title:(title||"Merchant"),isOriginal:false};

    var list = [];
    for (var i=0;i<snapshot.length;i++){
        var s = snapshot[i];
        var res = itemFromBase64(s.result);
        var mr = new MerchantRecipe(res, (s.maxUses!=null ? s.maxUses : 9999));
        var ings = [];
        var src = s.ingredients || [];
        for (var j=0;j<src.length;j++) ings.push(itemFromBase64(src[j]));
        try { mr.setIngredients(Java.to(ings, "java.util.List")); } catch(e){}
        try { mr.setUses(0); } catch(e){}
        try { mr.setDemand(s.demand || 0); } catch(e){}
        try { mr.setVillagerExperience(s.villagerXP || 0); } catch(e){}
        try { mr.setExperienceReward(!!s.expReward); } catch(e){}
        try { mr.setSpecialPrice(s.specialPrice || 0); } catch(e){}
        try { mr.setPriceMultiplier(s.priceMultiplier || 0.0); } catch(e){}
        try { mr.setIgnoreDiscounts(s.ignoreDiscounts !== false); } catch(e){}
        list.push(mr);
    }
    try { m.setRecipes(Java.to(list,"java.util.List")); } catch(e){}
    return {merchant:m,title:(title||"Merchant"),isOriginal:false};
}

function buildInventoryDataFromExisting(owner, openedFlag, itemSlot, titleOverride, holderForCreate) {
    function safeGetViewTitle(human) {
        try {
            var view = human.getOpenInventory();
            if (view && view.getTitle) {
                var t = view.getTitle();
                if (t != null && ("" + t).trim().length > 0) return "" + t;
            }
        } catch (e) { }
        return null;
    }
    function holderCustomNameOf(inv) {
        try {
            var h = inv && inv.getHolder ? inv.getHolder() : null;
            if (h && h.getCustomName) {
                var n = h.getCustomName();
                if (n != null && ("" + n).trim().length > 0) return "" + n;
            }
        } catch (e) { }
        return null;
    }
    function inferTitle(owner, inv, openedFlag, explicitTitle) {
        if (explicitTitle && ("" + explicitTitle).length > 0) return explicitTitle;
        if (openedFlag && (owner instanceof HumanEntity)) {
            var vt = safeGetViewTitle(owner);
            if (vt) return vt;
        }
        var hn = holderCustomNameOf(inv);
        if (hn) return hn;
        try {
            if (inv && inv.getType && inv.getType() === InventoryType.PLAYER) {
                if (owner && owner.getName) return owner.getName() + "'s inventory";
                return "Player's inventory";
            }
        } catch (e) { }
        try {
            if (inv && inv.getType) {
                return inv.getType().name();
            }
        } catch(e){}
        return "Inventory";
    }

    var inv = null;
    var cameFromItemContainer = false;

    if (openedFlag && owner instanceof HumanEntity) {
        var top = owner.getOpenInventory().getTopInventory();
        var extracted = extractItemContainerInventory(top, itemSlot);
        if (extracted) {
            inv = extracted;
            cameFromItemContainer = true;
        } else {
            inv = top;
        }
    } else if (owner && owner.material) {
        return {
            inv: ("" + owner.material),
            data: {
                holder: null,
                typeOrSize: materialToInvTypeOrNull(owner.material),
                constantType: materialToInvTypeOrNull(owner.material),
                title: titleOverride && ("" + titleOverride).length > 0
                       ? titleOverride
                       : (function(){
                            var t = materialToInvTypeOrNull(owner.material);
                            try { return t ? t.name() : "Inventory"; } catch(e){ return "Inventory"; }
                         })()
            }
        };
    } else {
        var baseInv = owner.getInventory ? owner.getInventory() : null;

        if (baseInv != null) {
            var extracted = extractItemContainerInventory(baseInv, itemSlot);
            if (extracted) { inv = extracted; cameFromItemContainer = true; }
            else { inv = baseInv; }
        } else if (owner.getEquipment) {
            if (itemSlot != null) {
                var extractedEq = extractItemContainerInventory(owner.getEquipment(), itemSlot);
                if (extractedEq) { inv = extractedEq; cameFromItemContainer = true; }
            }
            if (!inv) {
                var eqTitle = titleOverride && ("" + titleOverride).length > 0
                    ? titleOverride
                    : (owner.getName ? (owner.getName() + " equipment") : "Equipment");
                var eqInv = Bukkit.createInventory(
                    (holderForCreate instanceof InventoryHolder) ? holderForCreate : null,
                    9, eqTitle
                );
                try {
                    var eq = owner.getEquipment();
                    if (eq) {
                        if (eq.getItemInMainHand) eqInv.setItem(0, eq.getItemInMainHand());
                        if (eq.getItemInOffHand)  eqInv.setItem(1, eq.getItemInOffHand());
                        if (eq.getHelmet)         eqInv.setItem(2, eq.getHelmet());
                        if (eq.getChestplate)     eqInv.setItem(3, eq.getChestplate());
                        if (eq.getLeggings)       eqInv.setItem(4, eq.getLeggings());
                        if (eq.getBoots)          eqInv.setItem(5, eq.getBoots());
                    }
                } catch (e) { }
                inv = eqInv;
            }
        } else {
            inv = null;
        }
    }

    if (!inv) return { inv: null, data: null };

    if (inv.getSize) {
        var sz = inv.getSize();
        if (sz < 1 || sz > 54) {
            warn("Invalid owner's inventory size: " + sz);
        }
    }

    var holderPersistId = holderIdForStore(owner);
    var title = inferTitle(owner, inv, openedFlag, titleOverride);

    var typeOrSize = inv.getSize ? inv.getSize() : inv.getType();
    var constantType = inv.getType ? inv.getType() : null;

    return {
        inv: inv,
        data: {
            holder: holderPersistId,
            typeOrSize: typeOrSize,
            constantType: constantType,
            title: title
        },
        cameFromItemContainer: cameFromItemContainer
    };
}

function createInventoryFromData(holderResolved, invData) {
    var title = invData.title || "Inventory";
    var holderForCreate = (holderResolved instanceof InventoryHolder) ? holderResolved : null;

    var asNum = asInt(invData.typeOrSize);
    if (asNum != null) {
        if (!isValidChestSize(asNum)) throw "Invalid inventory size: " + asNum;
        return Bukkit.createInventory(holderForCreate, asNum, title);
    }

    var type = invData.typeOrSize instanceof java.lang.Enum
        ? invData.typeOrSize
        : asEnum(InventoryType, invData.typeOrSize);
    if (!type) throw "Invalid inventory type: " + invData.typeOrSize;
    if (!typeIsCreatableSafe(type)) throw "Inventory type '" + type + "' is not creatable.";
    return Bukkit.createInventory(holderForCreate, type, title);
}

function openFunctional(target, invTypeOrMat, locOrMerchant, fallbackInv, useFake) {
    var fake = !!useFake;

    if (fake && fallbackInv) {
        target.openInventory(fallbackInv);
        return;
    }

    switch ("" + invTypeOrMat) {
        case "" + InventoryType.ANVIL:
        case "ANVIL":
            if (target.openAnvil) { target.openAnvil(locOrMerchant, true); break; }
            if (fallbackInv) target.openInventory(fallbackInv);
            break;
        case "" + InventoryType.CARTOGRAPHY:
        case "CARTOGRAPHY_TABLE":
            if (target.openCartographyTable) { target.openCartographyTable(locOrMerchant, true); break; }
            if (fallbackInv) target.openInventory(fallbackInv);
            break;
        case "" + InventoryType.ENCHANTING:
        case "ENCHANTING_TABLE":
            if (target.openEnchanting) { target.openEnchanting(locOrMerchant, true); break; }
            if (fallbackInv) target.openInventory(fallbackInv);
            break;
        case "" + InventoryType.GRINDSTONE:
        case "GRINDSTONE":
            if (target.openGrindstone) { target.openGrindstone(locOrMerchant, true); break; }
            if (fallbackInv) target.openInventory(fallbackInv);
            break;
        case "" + InventoryType.LOOM:
        case "LOOM":
            if (target.openLoom) { target.openLoom(locOrMerchant, true); break; }
            if (fallbackInv) target.openInventory(fallbackInv);
            break;
        case "" + InventoryType.SMITHING:
        case "SMITHING_TABLE":
            if (target.openSmithingTable) { target.openSmithingTable(locOrMerchant, true); break; }
            if (fallbackInv) target.openInventory(fallbackInv);
            break;
        case "" + InventoryType.STONECUTTER:
        case "STONECUTTER":
            if (target.openStonecutter) { target.openStonecutter(locOrMerchant, true); break; }
            if (fallbackInv) target.openInventory(fallbackInv);
            break;
        case "" + InventoryType.WORKBENCH:
        case "CRAFTING_TABLE":
        case "WORKBENCH":
            if (target.openWorkbench) { target.openWorkbench(locOrMerchant, true); break; }
            if (fallbackInv) target.openInventory(fallbackInv);
            break;
        case "" + InventoryType.MERCHANT:
            if (target.openMerchant && (locOrMerchant instanceof Merchant)) {
                target.openMerchant(locOrMerchant, true);
                break;
            }
            if (fallbackInv) target.openInventory(fallbackInv);
            break;
        default:
            if (fallbackInv) target.openInventory(fallbackInv);
    }
}

function CEmanageInventory() {
    var ManageInventoryAction = Java.extend(ConditionalEventsAction, {
        execute: function (player, actionLine, minecraftEvent) {

            var args = actionLine.split(";");
            if (args.length < 2) {
                warn("Invalid actionLine format! CORRECT FORMAT: manage_inventory: action:<action (save|set|add|clear|open|delete, you can add ? before the action to use the temporary inventories storage, that is, until server restart)>;(only in case of save, open and delete) inventory:<inventory_id (indicates by which id/name the inventory will be used)>;(optional, only in case of open or save) fake:<true|false (indicates whether the real functionality of the inventory will persist or not, the same as content will be saved or not, etc)>;(only in case of save, open, set and add) owner:<entity_uuid|player_name|world,x,y,z (indicates whose inventory will be used as a source inventory (for example of some player), you also can use ^ before the nickname to use the open player's inventory, also you can use |<slot (index or named slot)> after to get inventory of the some item (for example, shulker box in inventory))>;(optional, only in case of save or open) holder:<inventory_holder (world,x,y,z|entity_uuid|player_name)>;(only in case of open, set, add and clear) target:<player (for which player the inventory will be changed or opened, in case of set, add or clear you can use here the same ^ and |<index or named slot> as well)>;(only in case of save and open) typeOrSize:<inventory_type (for example: CHEST) or integer size (must be a multiple of 9 between 9 and 54 slots, for example: 18)>;(optional, only in case of save, open, set or clear) title:<inventory_title>");
                return;
            }
            var params = {};
            for (var i = 0; i < args.length; i++) {
                var part = args[i].trim();
                if (part.length === 0) continue;
                var split = part.indexOf(":");
                if (split <= 0) { warn("Invalid parameter at position " + (i + 1) + ": " + args[i]); return; }
                var k = part.substring(0, split).trim();
                var v = part.substring(split + 1).trim();
                params[k] = v;
            }
            if (!params.action) { warn("Missing 'action' parameter!"); return; }

            var temp = ("" + params.action).charAt(0) === "?";
            var action = temp ? params.action.substring(1) : params.action;
            var store = temp ? customTempInventories : loadStore();

            if (action === "save") {
                if (!params.inventory) { warn("Inventory ID is not specified."); return; }

                var hasOwner     = !!params.owner;
                var hasTypeSize  = !!params.typeOrSize;
                var modeCount    = (hasOwner?1:0) + (hasTypeSize?1:0);
                if (modeCount !== 1) {
                    warn("For SAVE specify exactly one of: owner | typeOrSize.");
                    return;
                }

                var fakeAtSave = asBool(params.fake, false);

                function isFunctionalTypeName(name) {
                    if (!name) return false;
                    var upper = (""+name).toUpperCase();
                    try {
                        var t = InventoryType.valueOf(upper);
                        var n = "" + t;
                        for (var k in openableByBlockMaterial) {
                            if (("" + openableByBlockMaterial[k]) === n) return true;
                        }
                        if (t === InventoryType.MERCHANT) return true;
                        return false;
                    } catch (e) {
                        return openableByBlockMaterial[upper] != null;
                    }
                }

                if (hasOwner) {
                    var opened = ("" + params.owner).charAt(0) === "^";
                    var ownerExpr = opened ? params.owner.substring(1) : params.owner;

                    var slotExpr = null;
                    if (ownerExpr.indexOf("|") !== -1) {
                        var sp = ownerExpr.split("|");
                        ownerExpr = sp[0];
                        slotExpr = sp[1];
                    }

                    var itemSlot = null;
                    if (slotExpr != null) {
                        var n = asInt(slotExpr);
                        if (n != null) itemSlot = n;
                        else {
                            try { itemSlot = EquipmentSlot.valueOf(("" + slotExpr).toUpperCase()); } catch (e) { itemSlot = null; }
                        }
                    }

                    var owner = resolveHolder(ownerExpr);
                    if (!owner) { warn("Owner/holder not found: " + ownerExpr); return; }
                    
                    if (!opened && (owner instanceof AbstractVillager || owner instanceof Merchant)) {
                        var titleEff = (params.title && (""+params.title).length>0)
                            ? params.title
                            : (owner.getCustomName ? (owner.getCustomName() || "Merchant") : "Merchant");
                        var storeHolderKey = fakeAtSave
                            ? (params.holder ? (""+params.holder) : null)
                            : holderIdForStore(owner);

                        store[params.inventory] = {
                            holder: storeHolderKey,
                            typeOrSize: "MERCHANT",
                            constantType: "MERCHANT",
                            title: titleEff,
                            contents: null,
                            fake: fakeAtSave,
                            merchantRecipes: serializeMerchantRecipesFrom(owner) || []
                        };
                        if (temp) customTempInventories = store; else saveStore(store);
                        return;
                    }
                    
                    var explicitHolder = fakeAtSave ? (params.holder ? resolveHolder(params.holder) : null) : null;
                    var holderForCreate = chooseHolderForCreate(explicitHolder, owner, null, null, fakeAtSave);

                    var pair = buildInventoryDataFromExisting(owner, opened, itemSlot, params.title, holderForCreate);
                    var inv  = pair.inv;
                    var meta = pair.data;

                    if (!inv && !meta) { warn("Invalid inventory to save."); return; }
                    
                    var chosenTitle = (params.title && (""+params.title).length>0) ? params.title : (meta ? meta.title : "Inventory");
                    if (opened && pair.cameFromItemContainer && !params.title) {
                        try { chosenTitle = inv.getType ? inv.getType().name() : chosenTitle; } catch(e){}
                    }

                    var storeHolderKey = null;
                    if (!fakeAtSave) {
                        var invHolder = null;
                        try { invHolder = (inv && inv.getHolder) ? inv.getHolder() : null; } catch (e) {}

                        if (opened && pair.cameFromItemContainer && owner && owner.getOpenInventory) {
                            try {
                                var topInv = owner.getOpenInventory().getTopInventory();
                                var topHolder = topInv ? topInv.getHolder() : null;
                                var topKey = holderKeyFromInventoryHolder(topHolder);
                                if (topKey) storeHolderKey = topKey;
                            } catch(e){}
                        }
                        if (!storeHolderKey) {
                            var keyByInvHolder = holderKeyFromInventoryHolder(invHolder);
                            if (keyByInvHolder) storeHolderKey = keyByInvHolder;
                            else if (owner instanceof InventoryHolder) {
                                try { storeHolderKey = ""+owner.getUniqueId(); } catch(e){ storeHolderKey = ""+ownerExpr; }
                            } else {
                                storeHolderKey = ""+ownerExpr;
                            }
                        }
                    } else {
                        if (params.holder) {
                            storeHolderKey = ""+params.holder;
                        } else if (opened) {
                            var om = tryGetOpenMerchant(inv);
                            var trader = null;
                            try { trader = (om && om.getTrader) ? om.getTrader() : null; } catch (e) {}
                            if (trader && trader.getUniqueId) storeHolderKey = "" + trader.getUniqueId();
                        }
                    }

                    if (typeof inv === "string") {
                        var typeName = "" + meta.typeOrSize;
                        store[params.inventory] = {
                            holder: storeHolderKey,
                            typeOrSize: "" + typeName,
                            constantType: "" + typeName,
                            title: meta.title || "Inventory",
                            contents: null,
                            fake: fakeAtSave
                        };
                    } else {
                        var constType = inv.getType ? ("" + inv.getType()) : (meta ? ("" + meta.constantType) : "");
                        var isItemContainer = !!pair.cameFromItemContainer;
                        var functional = !isItemContainer && isFunctionalTypeName(constType);

                        if (functional) {
                            var merchantSnap = null;
                            if ((""+constType).toUpperCase() === "MERCHANT") {
                                merchantSnap = serializeMerchantRecipesFrom(inv) || serializeMerchantRecipesFrom(owner) || null;
                            }
                            store[params.inventory] = {
                                holder: storeHolderKey,
                                typeOrSize: "" + constType,
                                constantType: "" + constType,
                                title: chosenTitle,
                                contents: null,
                                merchantRecipes: merchantSnap,
                                fake: fakeAtSave
                            };
                        } else {
                            var contents = [];
                            try { contents = Java.from(inv.getContents()); } catch (e) { contents = []; }
                            var keepContents = ((""+constType).toUpperCase() === "PLAYER") ? true : !fakeAtSave;

                            store[params.inventory] = {
                                holder: storeHolderKey,
                                typeOrSize: (inv.getSize ? inv.getSize() : ("" + constType)),
                                constantType: "" + constType,
                                title: chosenTitle,
                                contents: keepContents ? contents.map(function(it){ return it ? it.clone() : null; }) : [],
                                fromItemContainer: !!pair.cameFromItemContainer,
                                fake: fakeAtSave
                            };
                        }
                    }

                    if (temp) customTempInventories = store; else saveStore(store);
                    return;
                }

                if (hasTypeSize) {
                    var typeOrSize = ("" + params.typeOrSize).trim();
                    if (!typeOrSize) { warn("Missing 'typeOrSize' for new inventory."); return; }

                    var tEnum = asEnum(InventoryType, typeOrSize.toUpperCase());
                    function isFunctionalTypeName2(name) {
                        if (!name) return false;
                        var upper = (""+name).toUpperCase();
                        try {
                            var t = InventoryType.valueOf(upper);
                            var n = "" + t;
                            for (var k in openableByBlockMaterial) {
                                if (("" + openableByBlockMaterial[k]) === n) return true;
                            }
                            if (t === InventoryType.MERCHANT) return true;
                            return false;
                        } catch (e) { return openableByBlockMaterial[upper] != null; }
                    }
                    var isFunctional = isFunctionalTypeName2(typeOrSize);

                    var holderResolved = fakeAtSave ? (params.holder ? resolveHolder(params.holder) : null) : null;
                    var titleEff = params.title || (tEnum ? tEnum.name() : "Inventory");

                    var storeHolderKey = fakeAtSave
                        ? (params.holder ? ("" + params.holder) : null)
                        : null;

                    if (isFunctional) {
                        var constType = tEnum ? ("" + tEnum) : ("" + typeOrSize.toUpperCase());
                        store[params.inventory] = {
                            holder: storeHolderKey,
                            typeOrSize: "" + constType,
                            constantType: "" + constType,
                            title: titleEff,
                            contents: null,
                            fake: fakeAtSave
                        };
                    } else {
                        var invData = { typeOrSize: typeOrSize, title: titleEff };
                        var created;
                        try { created = createInventoryFromData(holderResolved, invData); } catch (e) { warn("" + e); return; }

                        var contents = [];
                        try { contents = Java.from(created.getContents()); } catch (e) { contents = []; }

                        store[params.inventory] = {
                            holder: storeHolderKey,
                            typeOrSize: (created.getSize ? created.getSize() : ("" + created.getType())),
                            constantType: "" + (created.getType ? created.getType() : (tEnum ? tEnum : typeOrSize.toUpperCase())),
                            title: titleEff,
                            contents: fakeAtSave ? [] : contents.map(function(it){ return it ? it.clone() : null; }),
                            fake: fakeAtSave
                        };
                    }

                    if (temp) customTempInventories = store; else saveStore(store);
                    return;
                }
            }

            if (action === "open") {
                if (!params.target) { warn("Target player name is required."); return; }
                var target = Bukkit.getPlayer(params.target);
                if (!target) { warn("Target '" + params.target + "' not found or not online."); return; }

                var fake = asBool(params.fake, false);
                
                var hasOwner = !!params.owner;
                var hasTypeOrSize = !!params.typeOrSize;
                var hasInventory = !!params.inventory;

                var modeCount = (hasOwner?1:0) + (hasTypeOrSize?1:0) + (hasInventory?1:0);
                if (modeCount !== 1) {
                    warn("Specify exactly one of: owner | typeOrSize | inventory.");
                    return;
                }

                if (hasTypeOrSize) {
                    if (hasOwner || hasInventory) { warn("Do not combine typeOrSize with owner or inventory."); return; }

                    var invData = { typeOrSize: params.typeOrSize, title: params.title || "Inventory" };

                    var explicitHolderTS = asBool(params.fake, false)
                        ? (params.holder ? resolveHolder(params.holder) : null)
                        : null;

                    var holderResolved = explicitHolderTS;
                    if (!holderResolved && !asBool(params.fake, false) && target && target instanceof InventoryHolder) {
                        holderResolved = target;
                    }

                    try {
                        var tEnum = asEnum(InventoryType, (""+params.typeOrSize).toUpperCase());
                        if (tEnum === InventoryType.MERCHANT) {
                            var m = Bukkit.createMerchant(invData.title);
                            if (target.openMerchant) { target.openMerchant(m, true); }
                            else {
                                var visualM = Bukkit.createInventory(
                                    (holderResolved instanceof InventoryHolder) ? holderResolved : null,
                                    InventoryType.MERCHANT, invData.title
                                );
                                target.openInventory(visualM);
                            }
                            return;
                        }

                        var created = createInventoryFromData(holderResolved, invData);

                        var isFunctional = false;
                        if (tEnum) {
                            isFunctional =
                                tEnum === InventoryType.ANVIL       ||
                                tEnum === InventoryType.CARTOGRAPHY ||
                                tEnum === InventoryType.ENCHANTING  ||
                                tEnum === InventoryType.GRINDSTONE  ||
                                tEnum === InventoryType.LOOM        ||
                                tEnum === InventoryType.SMITHING    ||
                                tEnum === InventoryType.STONECUTTER ||
                                tEnum === InventoryType.WORKBENCH;
                        }

                        if (isFunctional) {
                            openFunctional(target, tEnum, (target.getLocation ? target.getLocation() : null), created, fake);
                        } else {
                            target.openInventory(created);
                        }
                    } catch (e) {
                        warn("" + e);
                    }
                    return;
                }

                if (hasOwner) {
                    var opened = ("" + params.owner).charAt(0) === "^";
                    var ownerExpr = opened ? params.owner.substring(1) : params.owner;

                    var slotExpr = null;
                    if (ownerExpr.indexOf("|") !== -1) {
                        var sp = ownerExpr.split("|");
                        ownerExpr = sp[0];
                        slotExpr = sp[1];
                    }

                    var itemSlot = null;
                    if (slotExpr != null) {
                        var n = asInt(slotExpr);
                        if (n != null) itemSlot = n;
                        else {
                            try { itemSlot = EquipmentSlot.valueOf(("" + slotExpr).toUpperCase()); } catch (e) { itemSlot = null; }
                        }
                    }

                    var owner = resolveHolder(ownerExpr);
                    if (!owner) { warn("Owner/holder not found: " + ownerExpr); return; }
                    
                    var explicitHolder = asBool(params.fake, false) ? (params.holder ? resolveHolder(params.holder) : null) : null;
                    var holderForCreate = chooseHolderForCreate(explicitHolder, owner, null, target, asBool(params.fake, false));

                    var pair = buildInventoryDataFromExisting(owner, opened, itemSlot, params.title, holderForCreate);
                    var inv  = pair.inv;
                    holderForCreate = chooseHolderForCreate(explicitHolder, owner, inv, target, asBool(params.fake, false));
                    if (!inv) { warn("Invalid inventory to open."); return; }
                    
                    if (pair.cameFromItemContainer) {
                        var wantFake = asBool(params.fake, false);
                        if (wantFake) {
                            var titleIC = params.title || (inv.getType ? inv.getType().name() : "Inventory");
                            var visual = createVisualInventoryLike(inv, titleIC, holderForCreate);
                            target.openInventory(visual);
                        } else {
                            target.openInventory(inv);
                        }
                        return;
                    }

                    if (opened) {
                        var wantFake = asBool(params.fake, false);
                        var t = inv.getType ? inv.getType() : null;
                        
                        if (t === InventoryType.MERCHANT) {
                            var wantFake = asBool(params.fake, false);
                            var openedMerchant = tryGetOpenMerchant(inv);
                            if (!openedMerchant && owner && owner.getOpenInventory) {
                                openedMerchant = tryGetOpenMerchant(owner.getOpenInventory().getTopInventory());
                            }

                            if (wantFake) {
                                var builtFake = buildMerchantFromHolder(openedMerchant || owner, params.title, true);
                                if (target.openMerchant) target.openMerchant(builtFake.merchant, true);
                                else target.openInventory(Bukkit.createInventory(null, InventoryType.MERCHANT, builtFake.title));
                                return;
                            }

                            try {
                                openFunctional(target, InventoryType.MERCHANT, openedMerchant, null, false);
                            } catch (e) {
                                var built = buildMerchantFromHolder(openedMerchant || owner, params.title, true);
                                if (target.openMerchant) target.openMerchant(built.merchant, true);
                                else target.openInventory(Bukkit.createInventory(null, InventoryType.MERCHANT, built.title));
                            }
                            return;
                        }

                        if (!wantFake && t && (
                            t === InventoryType.ANVIL || t === InventoryType.CARTOGRAPHY ||
                            t === InventoryType.ENCHANTING || t === InventoryType.GRINDSTONE ||
                            t === InventoryType.LOOM || t === InventoryType.SMITHING ||
                            t === InventoryType.STONECUTTER || t === InventoryType.WORKBENCH
                        )) {
                            openFunctional(target, t, owner.getLocation ? owner.getLocation() : null, null, false);
                            return;
                        }

                        if (!wantFake && t && (""+t) === "CRAFTING" && (owner instanceof HumanEntity) && owner.getInventory) {
                            try { target.openInventory(owner.getInventory()); return; } catch (e) {}
                        }

                        var titleOpened = params.title || (pair.data && pair.data.title) || "Inventory";
                        var originalHolder = null;
                        try { originalHolder = inv.getHolder ? inv.getHolder() : null; } catch (e) {}
                        var holderForOpened = (originalHolder && originalHolder instanceof InventoryHolder)
                            ? originalHolder
                            : holderForCreate;
                        
                        if (wantFake) {
                            holderForOpened = (explicitHolder && explicitHolder instanceof InventoryHolder) ? explicitHolder : null;
                        }

                        var visualOpened = createVisualInventoryLike(inv, titleOpened, holderForOpened);

                        if (!wantFake) {
                            try {
                                var cont = inv.getContents ? Java.from(inv.getContents()) : null;
                                if (cont) {
                                    for (var i = 0; i < Math.min(cont.length, visualOpened.getSize()); i++) {
                                        visualOpened.setItem(i, cont[i] ? cont[i].clone() : null);
                                    }
                                }
                            } catch (e) {}
                        }
                        target.openInventory(visualOpened);
                        return;
                    }
                    
                    if (owner instanceof AbstractVillager || owner instanceof Merchant) {
                        var openedMerchant = tryGetOpenMerchant(inv);
                        var wantFake = asBool(params.fake, false);

                        if (wantFake) {
                            var src = openedMerchant || owner;
                            var built = buildMerchantFromHolder(src, params.title, true);
                            if (target.openMerchant) target.openMerchant(built.merchant, true);
                            else {
                                try {
                                    var visual = Bukkit.createInventory(holderForCreate, InventoryType.MERCHANT, built.title);
                                    target.openInventory(visual);
                                } catch (e) {}
                            }
                            return;
                        } else {
                            var srcReal = openedMerchant || owner;
                            openFunctional(target, InventoryType.MERCHANT, srcReal, null, false);
                            return;
                        }
                    }

                    if (!(owner instanceof HumanEntity) && owner.getInventory && typeof owner.getInventory === "function") {
                        if (fake) {
                            var titleEnt = params.title || (pair.data && pair.data.title) || "Inventory";
                            var visualE = createVisualInventoryLike(inv, titleEnt, holderForCreate);
                            target.openInventory(visualE);
                            return;
                        }
                    }

                    if (owner instanceof HumanEntity && fake) {
                        var pInv = owner.getInventory();
                        var title = params.title || (owner.getName ? (owner.getName() + "'s inventory") : "Inventory");
                        var fakeInv = Bukkit.createInventory(holderForCreate, 45, title);

                        var storage = null;
                        try { storage = Java.from(pInv.getStorageContents()); } catch (e) { storage = Java.from(pInv.getContents()); }
                        for (var i = 0; i < 36; i++) {
                            var it = (storage && i < storage.length) ? storage[i] : null;
                            fakeInv.setItem(i, it ? it.clone() : null);
                        }
                        var boots = null, leggings = null, chest = null, helm = null;
                        try {
                            var armor = Java.from(pInv.getArmorContents());
                            if (armor && armor.length >= 4) { boots = armor[0]; leggings = armor[1]; chest = armor[2]; helm = armor[3]; }
                        } catch (e) {
                            boots = pInv.getBoots ? pInv.getBoots() : null;
                            leggings = pInv.getLeggings ? pInv.getLeggings() : null;
                            chest = pInv.getChestplate ? pInv.getChestplate() : null;
                            helm = pInv.getHelmet ? pInv.getHelmet() : null;
                        }
                        var off = pInv.getItemInOffHand ? pInv.getItemInOffHand() : null;
                        fakeInv.setItem(36, helm ? helm.clone() : null);
                        fakeInv.setItem(37, chest ? chest.clone() : null);
                        fakeInv.setItem(38, leggings ? leggings.clone() : null);
                        fakeInv.setItem(39, boots ? boots.clone() : null);
                        fakeInv.setItem(40, off ? off.clone() : null);

                        target.openInventory(fakeInv);
                        return;
                    }

                    if (owner instanceof BlockInventoryHolder) {
                        if (fake) {
                            var invBH = extractItemContainerInventory(owner.getInventory(), itemSlot) || owner.getInventory();
                            var titleBH = params.title
                                || (invBH.getHolder() && invBH.getHolder().getCustomName ? invBH.getHolder().getCustomName() : null)
                                || (invBH.getType ? invBH.getType().name() : "Inventory");
                            var fakeInvBH = createVisualInventoryLike(invBH, titleBH, holderForCreate);
                            target.openInventory(fakeInvBH);
                        } else {
                            var invToOpen = inv || owner.getInventory();
                            target.openInventory(invToOpen);
                        }
                        return;
                    }

                    if (typeof inv === "string") {
                        var matName = inv;
                        var invType = materialToInvTypeOrNull(matName);
                        var loc = owner.location || null;
                        var fallback = null;
                        try {
                            fallback = Bukkit.createInventory(holderForCreate, invType, params.title || ("" + matName));
                        } catch (e) { fallback = null; }
                        openFunctional(target, invType || matName, loc, fallback, fake);
                        return;
                    }

                    if (inv.getType && !typeIsCreatableSafe(inv.getType())) {
                        var tnc = "" + inv.getType();
                        if (tnc === "CRAFTING" && (owner instanceof HumanEntity) && owner.getInventory) {
                            try { target.openInventory(owner.getInventory()); return; } catch (e) {}
                            var vis = createVisualInventoryLike(inv, params.title || "Inventory", holderForCreate);
                            target.openInventory(vis);
                            return;
                        }
                        if (fake) {
                            var vis2 = createVisualInventoryLike(inv, params.title || (pair.data && pair.data.title) || "Inventory", holderForCreate);
                            target.openInventory(vis2);
                            return;
                        }
                        target.openInventory(inv);
                        return;
                    }
                    
                    var invType = inv.getType ? inv.getType() : null;
                    if (
                        inv.getSize &&
                        (inv.getSize() < 9 || (inv.getSize() % 9 !== 0)) &&
                        (!invType || typeIsCreatableSafe(invType)) &&
                        !(invType && invType === InventoryType.PLAYER)
                    ) {
                        var sz = inv.getSize();
                        var normTitle = params.title || (pair.data && pair.data.title) || "Inventory";
                        var normSize = Math.min(54, Math.ceil(sz / 9) * 9);

                        var visual = Bukkit.createInventory(holderForCreate, normSize, normTitle);
                        if (!fake) {
                            try {
                                var contents = inv.getContents ? Java.from(inv.getContents()) : null;
                                if (contents) {
                                    for (var i = 0; i < Math.min(contents.length, normSize); i++) {
                                        visual.setItem(i, contents[i] ? contents[i].clone() : null);
                                    }
                                }
                            } catch (e) { }
                        }
                        target.openInventory(visual);
                        return;
                    }

                    if (fake) {
                        var titleF = params.title || (pair.data && pair.data.title) || "Inventory";
                        var vis3 = createVisualInventoryLike(inv, titleF, holderForCreate);
                        target.openInventory(vis3);
                        return;
                    }

                    target.openInventory(inv);
                    return;
                }

                if (hasInventory) {
                    if (!params.inventory) { warn("Inventory ID is required when owner is not provided."); return; }
                    var saved = store[params.inventory];
                    if (!saved) { warn("Inventory ID '" + params.inventory + "' not found."); return; }

                    if (params.fake == null && saved && saved.fake === true) {
                        params.fake = "true";
                    }
                    var fakeSaved = asBool(params.fake, false);
                    var titleEff  = params.title || saved.title || "Inventory";
                    var wantFakeSaved = asBool(params.fake == null ? saved.fake : params.fake, false);

                    var constType = saved.constantType ? ("" + saved.constantType).toUpperCase() : "";

                    var holderKey = (constType === "MERCHANT")
                        ? (wantFakeSaved ? (params.holder || saved.holder || null) : (saved.holder || null))
                        : ((params.holder != null) ? params.holder : (saved.holder || null));

                    var holderResolved = holderKey ? resolveHolder(holderKey) : null;

                    var holderForCreateSaved = null;
                    if (wantFakeSaved) {
                        holderForCreateSaved = (holderResolved instanceof InventoryHolder) ? holderResolved : null;
                    } else {
                        holderForCreateSaved = (holderResolved instanceof InventoryHolder)
                            ? holderResolved
                            : (target instanceof InventoryHolder ? target : null);
                    }
                    
                    if (constType === "PLAYER") {
                        var wantFake = wantFakeSaved;
                        var size = wantFake ? 45 : 36;
                        var vis = Bukkit.createInventory(
                            wantFake ? ((holderResolved instanceof InventoryHolder) ? holderResolved : null) : holderForCreateSaved,
                            size, titleEff
                        );

                        var savedArr = saved.contents || [];

                        for (var i = 0; i < 36 && i < savedArr.length && i < vis.getSize(); i++) {
                            var it = savedArr[i];
                            vis.setItem(i, it ? it.clone() : null);
                        }

                        if (wantFake && vis.getSize() >= 41) {
                            function getSaved(idx){ return (idx < savedArr.length && savedArr[idx]) ? savedArr[idx].clone() : null; }
                            var helm = getSaved(39), chest = getSaved(38), legs = getSaved(37), boots = getSaved(36), off = getSaved(40);
                            vis.setItem(36, helm);
                            vis.setItem(37, chest);
                            vis.setItem(38, legs);
                            vis.setItem(39, boots);
                            vis.setItem(40, off);
                        }

                        target.openInventory(vis);
                        return;
                    }

                    var constType = saved.constantType ? ("" + saved.constantType).toUpperCase() : "";

                    var functional = (constType === "MERCHANT") || openableByBlockMaterial[constType] != null || (function () {
                        try {
                            var t = InventoryType.valueOf(constType);
                            var name = "" + t;
                            for (var key in openableByBlockMaterial) {
                                if (("" + openableByBlockMaterial[key]) === name) return true;
                            }
                            return false;
                        } catch (e) { return false; }
                    })();
                    
                    if (saved.fromItemContainer === true) {
                        functional = false;
                    }

                    if (functional) {
                        var invType = null;
                        try { invType = InventoryType.valueOf(constType); } catch (e) { invType = null; }

                        if (invType === InventoryType.MERCHANT) {
                            var built;
                            if (saved.merchantRecipes) {
                                built = buildMerchantFromSnapshot(saved.merchantRecipes, titleEff);
                            } else {
                                var hResolved = holderResolved || null;
                                built = buildMerchantFromHolder(hResolved, titleEff, true);
                            }
                            if (target.openMerchant) {
                                target.openMerchant(built.merchant, true);
                            } else {
                                target.openInventory(Bukkit.createInventory(holderForCreateSaved, InventoryType.MERCHANT, built.title));
                            }
                        	return;
                        }

                        var visual = null;
                        try {
                            if (invType && typeIsCreatableSafe(invType))
                                visual = Bukkit.createInventory(holderForCreateSaved, invType, titleEff);
                        } catch (e) { visual = null; }

                        var locOrMerchant = null;
                        if (holderKey) {
                            var h = resolveHolder(holderKey);
                            if (h) {
                                if (h.location)           locOrMerchant = h.location;
                                else if (h.getLocation)   locOrMerchant = h.getLocation();
                            }
                        }

                        openFunctional(target, invType || constType, locOrMerchant, visual, fakeSaved);
                        return;
                    }

                    var invToOpen = null;
                    var asNumSaved = asInt(saved.typeOrSize);

                    if (asNumSaved != null && !isValidChestSize(asNumSaved)) {
                        var inferredLen = (saved.contents && saved.contents.length) ? saved.contents.length : asNumSaved;
                        var normSize = Math.min(54, Math.max(9, Math.ceil(inferredLen / 9) * 9));
                        invToOpen = Bukkit.createInventory(holderForCreateSaved, normSize, titleEff);
                    } else {
                        var invData = { typeOrSize: saved.typeOrSize, title: titleEff };
                        try {
                            invToOpen = createInventoryFromData(holderForCreateSaved, invData);
                        } catch (e) {
                            try {
                                if (holderResolved instanceof HumanEntity || (saved.constantType && ("" + saved.constantType).toUpperCase() === "PLAYER")) {
                                    invToOpen = Bukkit.createInventory(holderForCreateSaved, 45, titleEff);
                                } else {
                                    warn("" + e);
                                    return;
                                }
                            } catch (e2) { warn("" + e2); return; }
                        }
                    }

                    if (!fakeSaved && saved.contents && invToOpen && invToOpen.getSize) {
                        var size = invToOpen.getSize();
                        var set = new java.util.ArrayList();
                        for (var iC = 0; iC < size; iC++) set.add(null);

                        for (var iS = 0; iS < saved.contents.length && iS < size; iS++) {
                            var it = saved.contents[iS];
                            set.set(iS, it ? it.clone() : null);
                        }
                        invToOpen.setContents(set.toArray(Java.to([], "org.bukkit.inventory.ItemStack[]")));
                    }

                    target.openInventory(invToOpen);
                    return;
                }
            }
            
            if (action === "set" || action === "add" || action === "clear") {
                var actionMode = action;

                var hasOwner = !!params.owner;
                var hasInventory = !!params.inventory;
                if (!hasOwner && !hasInventory && !!params.target && (params.title || actionMode === "clear")){
                    var tOpenedOnly = (""+params.target).charAt(0) === "^";
                    var tName = tOpenedOnly ? params.target.substring(1) : params.target;
                    var pl = Bukkit.getPlayer(tName);
                    if (!pl || !(pl instanceof HumanEntity)) { warn("Title-set requires a player target."); return; }
                    var view = pl.getOpenInventory();
                    if (!view) { warn("Player has no open inventory."); return; }

                    var newTitle = (actionMode === "clear")
                        ? (view.getOriginalTitle ? view.getOriginalTitle() : view.getTitle())
                        : (params.title || view.getTitle());

                    try {
                        if (view.setTitle) { view.setTitle(newTitle); return; }
                        throw "no setTitle";
                    } catch(e){
                        try {
                            var top = view.getTopInventory();
                            var vis = createVisualInventoryLike(top, newTitle,
                                chooseHolderForCreate(null, null, top, pl, false));
                            try {
                                var cont = Java.from(top.getContents());
                                vis.setContents(Java.to(cont, "org.bukkit.inventory.ItemStack[]"));
                            } catch(e2){}
                            pl.openInventory(vis);
                            return;
                        } catch(e3){ warn("Unable to retitle: "+e3); return; }
                    }
                }

                if ((hasOwner?1:0) + (hasInventory?1:0) !== 1) {
                    warn("For "+actionMode.toUpperCase()+" specify exactly one of: owner | inventory (as a source), or only target+title for title change.");
                    return;
                }
                if (!params.target) { warn("Target (holder) is required for "+actionMode.toUpperCase()+"."); return; }

                var tOpened = (""+params.target).charAt(0) === "^";
                var targetExpr = tOpened ? params.target.substring(1) : params.target;

                var tSlotExpr = null;
                if (targetExpr.indexOf("|") !== -1) {
                    var tp = targetExpr.split("|");
                    targetExpr = tp[0];
                    tSlotExpr = tp[1];
                }
                var tItemSlot = null;
                if (tSlotExpr != null) {
                    var n = asInt(tSlotExpr);
                    if (n != null) tItemSlot = n;
                    else { try { tItemSlot = EquipmentSlot.valueOf((""+tSlotExpr).toUpperCase()); } catch(e){ tItemSlot = null; } }
                }
                var targetHolder = resolveHolder(targetExpr);
                if (!targetHolder) { warn("Target holder not found: " + targetExpr); return; }

                var srcItems = null, srcIsPlayerLike = false, srcMerchantSnapshot = null;
                if (hasInventory) {
                    var saved = store[params.inventory];
                    if (!saved) { warn("Inventory ID '" + params.inventory + "' not found."); return; }
                    var ctype = saved.constantType ? (""+saved.constantType).toUpperCase() : "";
                    if (ctype === "MERCHANT") srcMerchantSnapshot = saved.merchantRecipes || [];
                    else { srcItems = snapshotItemsFromSaved(saved); srcIsPlayerLike = (ctype === "PLAYER"); }
                } else {
                    var oOpened = (""+params.owner).charAt(0) === "^";
                    var ownerExpr = oOpened ? params.owner.substring(1) : params.owner;
                    var oSlotExpr = null;
                    if (ownerExpr.indexOf("|") !== -1) { var op = ownerExpr.split("|"); ownerExpr = op[0]; oSlotExpr = op[1]; }
                    var oItemSlot = null;
                    if (oSlotExpr != null) {
                        var n2 = asInt(oSlotExpr);
                        if (n2 != null) oItemSlot = n2;
                        else { try { oItemSlot = EquipmentSlot.valueOf((""+oSlotExpr).toUpperCase()); } catch(e){ oItemSlot = null; } }
                    }
                    var owner = resolveHolder(ownerExpr);
                    if (!owner) { warn("Owner/holder not found: " + ownerExpr); return; }

                    var pair = buildInventoryDataFromExisting(owner, oOpened, oItemSlot, null, null);
                    var inv = pair ? pair.inv : null;
                    if (!inv && !(owner instanceof AbstractVillager) && !(owner instanceof Merchant)) {
                        warn("Unable to read source inventory for "+actionMode.toUpperCase()+"."); return;
                    }
                    var t = null; try { t = inv && inv.getType ? inv.getType() : null; } catch(e){}
                    if ((owner instanceof AbstractVillager) || (owner instanceof Merchant) || (t === InventoryType.MERCHANT)) {
                        var snapSource = (t === InventoryType.MERCHANT && inv) ? inv : owner;
                        srcMerchantSnapshot = serializeMerchantRecipesFrom(snapSource) || [];
                    } else {
                        srcItems = snapshotItemsFromInventory(inv);
                        try { srcIsPlayerLike = (inv && inv.getType && inv.getType() === InventoryType.PLAYER); } catch(e){ srcIsPlayerLike = false; }
                    }
                }
                if (!srcItems) srcItems = [];

                if (srcMerchantSnapshot) {
                    if (applyMerchantSnapshotToTargetWithMode(targetHolder, srcMerchantSnapshot, actionMode)) return;
                    return;
                }

                if (tSlotExpr != null){
                    if (tOpened){
                        if (!(targetHolder instanceof HumanEntity)) { warn(actionMode.toUpperCase()+": ^target requires a human entity."); return; }
                        var top = targetHolder.getOpenInventory().getTopInventory();
                        if (typeof tItemSlot === "number"){
                            if (!mutateItemContainerInInventory(top, tItemSlot, actionMode, srcItems, true)){
                                warn("can't mutate item-container in opened inv at slot "+tItemSlot);
                            }
                            return;
                        } else { warn("EquipmentSlot is not supported with ^target for item-container."); return; }
                    } else {
                        if (typeof tItemSlot === "number"){
                            var baseInv = (targetHolder.getInventory && typeof targetHolder.getInventory === "function") ? targetHolder.getInventory() : null;
                            if (!baseInv) { warn(actionMode.toUpperCase()+": target has no inventory for slot "+tItemSlot); return; }
                            if (!mutateItemContainerInInventory(baseInv, tItemSlot, actionMode, srcItems, true)){
                                warn("can't mutate item-container at slot "+tItemSlot);
                            }
                            return;
                        }
                    }
                }

                if (tOpened) {
                    if (!(targetHolder instanceof HumanEntity)) { warn(actionMode.toUpperCase()+": ^target requires a human entity."); return; }
                    var topInv = targetHolder.getOpenInventory().getTopInventory();
                    if (actionMode === "clear") { clearInventoryContents(topInv); return; }
                    if (actionMode === "add")   { addItemsToInventory(topInv, srcItems); return; }
                    fillInventoryExactOrSequential(topInv, srcItems, true);
                    return;
                }
                
                if (tSlotExpr != null && tItemSlot != null && targetHolder.getEquipment && typeof targetHolder.getEquipment === "function"){
                    var eq = targetHolder.getEquipment();
                    if (mutateItemContainerInEquipment(eq, tItemSlot, actionMode, srcItems, true)) return;

                    if (actionMode === "clear"){
                        try { eq.setItem(tItemSlot, null); } catch(e){}
                        return;
                    }
                    var first = null;
                    for (var si=0; si<srcItems.length; si++){ if (srcItems[si]) { first = srcItems[si].clone(); break; } }
                    try {
                        if (actionMode === "add"){
                            var cur = eq.getItem(tItemSlot);
                            if (cur == null || (cur.getType && cur.getType() === Material.AIR)) eq.setItem(tItemSlot, first);
                        } else { eq.setItem(tItemSlot, first); }
                    } catch(e){}
                    return;
                }

                if (targetHolder instanceof HumanEntity && targetHolder.getInventory) {
                    var pInv = targetHolder.getInventory();
                    if (actionMode === "clear") { try { pInv.clear(); } catch(e){} return; }
                    if (actionMode === "add")   { addItemsToInventory(pInv, srcItems); return; }
                    if (!applyToPlayerInventory(pInv, srcItems, true, srcIsPlayerLike)) warn("failed to apply to player inventory.");
                    return;
                }

                if (targetHolder instanceof InventoryHolder) {
                    var dest = targetHolder.getInventory();
                    if (actionMode === "clear") { clearInventoryContents(dest); return; }
                    if (actionMode === "add")   { addItemsToInventory(dest, srcItems); return; }
                    if (!fillInventoryExactOrSequential(dest, srcItems, true)) warn("failed to apply to target inventory.");
                    return;
                }

                if (targetHolder && targetHolder.material) { warn(actionMode.toUpperCase()+": target is a material block, not an InventoryHolder or \"EquipmentHolder\"."); return; }
                warn(actionMode.toUpperCase()+": unsupported target.");
                return;
            }

            if (action === "delete") {
                if (!params.inventory) { 
                    warn("Inventory ID is required for delete.");
                    return;
                }

                if (storeHas(store, params.inventory)) {
                    storeDel(store, params.inventory);

                    if (temp) customTempInventories = store;
                    else saveStore(store);
                } else {
                    warn("Inventory ID '" + params.inventory + "' not found.");
                }
                return;
            }

            warn("Unknown action '" + action + "'");
        }
    });

    var manageInventoryInstance = new ManageInventoryAction("manage_inventory");
    
    return manageInventoryInstance;
}

CEmanageInventory();