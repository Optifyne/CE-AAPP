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
var Location = Java.type("org.bukkit.Location");
var Colorable = Java.type("org.bukkit.material.Colorable");
var DyeColor = Java.type("org.bukkit.DyeColor");
var Sign = Java.type("org.bukkit.block.Sign");
var Side = Java.type("org.bukkit.block.sign.Side");

function CEchangeColor() {
    var ChangeColorAction = Java.extend(ConditionalEventsAction, {
        execute: function(player, actionLine, minecraftEvent) {
            var args = actionLine.split(";");
            if (args.length < 2) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_COLOR ACTION: Invalid format! Use: change_color: <entity_uuid|world,x,y,z>;<color>;(optional, only in case of SIGN blocks) <side (may be FRONT or BACK)>");
                return;
            }

            var target = null;
            try {
                target = Bukkit.getEntity(UUID.fromString(args[0]));
            } catch (e) {
            	var rawLoc = args[0].split(",");
                var world = Bukkit.getWorld(rawLoc[0]);
                var x = parseFloat(rawLoc[1]);
                var y = parseFloat(rawLoc[2]);
                var z = parseFloat(rawLoc[3]);

                if (world && !isNaN(x) && !isNaN(y) && !isNaN(z)) target = new Location(world, x, y, z);
            }
            
            if (!target) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_COLOR ACTION: Entity or location not found: " + args[0]);
                return;
            }
            
            var side = null;
            if (target instanceof Location) {
                target = target.getBlock().getState();
                
                try {
                	side = Side.valueOf(args[2].trim().toUpperCase());
                } catch (e) {}
                
                if (target instanceof Sign && side) side = target.getSide(side);
                else side = null;
            }
            
            if (!(target instanceof Colorable)) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_COLOR ACTION: Target is not Colorable!");
                return;
            }

            var color = null
            try {
                color = DyeColor.valueOf(args[1].trim().toUpperCase());
            } catch (e) {}
            
            if (!color) {
                Bukkit.getLogger().warning("[CEActions] CHANGE_COLOR ACTION: Invalid color: " + args[1]);
                return;
            }
            
            side ? side.setColor(color) : target.setColor(color);
            if (target instanceof org.bukkit.block.BlockState) target.update();
        }
    });

    var changeColorInstance = new ChangeColorAction("change_color");

    return changeColorInstance;
}

CEchangeColor();