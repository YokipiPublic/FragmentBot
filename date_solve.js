'use strict';

const date_solve = {};

const cv = require('./lib/opencv.js');
const Discord = require('discord.js');
const Jimp = require('jimp');


// Populate dictionaries
const possible_attractions = [];
possible_attractions.push(['G', 'assets/fuel.png']);
possible_attractions.push(['T', 'assets/taco.png']);
possible_attractions.push(['P', 'assets/spaghetti.png']);
possible_attractions.push(['S', 'assets/sandwich.png']);
possible_attractions.push(['J', 'assets/juice.png']);
possible_attractions.push(['C', 'assets/coffee.png']);
possible_attractions.push(['N', 'assets/drink.png']);
possible_attractions.push(['M', 'assets/masks.png']);
possible_attractions.push(['F', 'assets/ferris.png']);
possible_attractions.push(['B', 'assets/dancer.png']);
possible_attractions.push(['L', 'assets/flower.png']);
possible_attractions.push(['A', 'assets/airplane.png']);
possible_attractions.push(['R', 'assets/ring.png']);
possible_attractions.push(['O', 'assets/bags.png']);
possible_attractions.push(['H', 'assets/house.png']);
possible_attractions.push(['X', 'assets/tree.png']);

const attraction_locations = [];
let y_locations = [151, 186, 227, 276, 336, 411, 508];
let x_middle = 400;
let x_offsets = [61, 65, 73, 80, 90, 101, 117];
for (let i = 0; i < 7; i++) {
  for (let j = -2; j < 3; j++) {
    attraction_locations.push([x_middle + j*x_offsets[i] - 16, y_locations[i]]);
  }
}

const color_values = [];
color_values['road'] = [53, 86, 113];
color_values['block'] = [187, 209, 219];
color_values['front'] = [47, 108, 250];
color_values['back'] = [78, 195, 250];

const vertical_road_pixels = [];
vertical_road_pixels.push([303, 191]);
vertical_road_pixels.push([366, 191]);
vertical_road_pixels.push([435, 191]);
vertical_road_pixels.push([496, 191]);
vertical_road_pixels.push([295, 225]);
vertical_road_pixels.push([362, 225]);
vertical_road_pixels.push([438, 225]);
vertical_road_pixels.push([505, 225]);
vertical_road_pixels.push([285, 265]);
vertical_road_pixels.push([358, 265]);
vertical_road_pixels.push([441, 265]);
vertical_road_pixels.push([515, 265]);
vertical_road_pixels.push([270, 315]);
vertical_road_pixels.push([353, 315]);
vertical_road_pixels.push([446, 315]);
vertical_road_pixels.push([525, 315]);
vertical_road_pixels.push([256, 375]);
vertical_road_pixels.push([348, 375]);
vertical_road_pixels.push([451, 375]);
vertical_road_pixels.push([543, 375]);
vertical_road_pixels.push([235, 455]);
vertical_road_pixels.push([341, 455]);
vertical_road_pixels.push([459, 455]);
vertical_road_pixels.push([563, 455]);
vertical_road_pixels.push([209, 555]);
vertical_road_pixels.push([330, 555]);
vertical_road_pixels.push([467, 555]);
vertical_road_pixels.push([588, 555]);

const horizontal_road_pixels = [];
horizontal_road_pixels.push([292, 200]);
horizontal_road_pixels.push([354, 200]);
horizontal_road_pixels.push([417, 200]);
horizontal_road_pixels.push([445, 200]);
horizontal_road_pixels.push([508, 200]);
horizontal_road_pixels.push([283, 235]);
horizontal_road_pixels.push([350, 235]);
horizontal_road_pixels.push([418, 235]);
horizontal_road_pixels.push([448, 235]);
horizontal_road_pixels.push([516, 235]);
horizontal_road_pixels.push([270, 278]);
horizontal_road_pixels.push([345, 278]);
horizontal_road_pixels.push([420, 278]);
horizontal_road_pixels.push([453, 278]);
horizontal_road_pixels.push([530, 278]);
horizontal_road_pixels.push([255, 330]);
horizontal_road_pixels.push([339, 330]);
horizontal_road_pixels.push([423, 330]);
horizontal_road_pixels.push([458, 330]);
horizontal_road_pixels.push([543, 330]);
horizontal_road_pixels.push([236, 395]);
horizontal_road_pixels.push([333, 395]);
horizontal_road_pixels.push([427, 395]);
horizontal_road_pixels.push([466, 395]);
horizontal_road_pixels.push([563, 395]);
horizontal_road_pixels.push([212, 480]);
horizontal_road_pixels.push([321, 480]);
horizontal_road_pixels.push([432, 480]);
horizontal_road_pixels.push([475, 480]);
horizontal_road_pixels.push([586, 480]);

const attraction_names = [];
attraction_names['1'] = 'Gas 1';
attraction_names['2'] = 'Gas 2';
attraction_names['3'] = 'Gas 3';
attraction_names['T'] = 'Taco';
attraction_names['P'] = 'Pasta';
attraction_names['S'] = 'Deli';
attraction_names['J'] = 'Juice';
attraction_names['C'] = 'Coffee';
attraction_names['N'] = 'Club';
attraction_names['M'] = 'Masks';
attraction_names['F'] = 'Fair';
attraction_names['B'] = 'Dancer';
attraction_names['L'] = 'Flower';
attraction_names['A'] = 'Airport';
attraction_names['R'] = 'Ring';
attraction_names['O'] = 'Bags';
attraction_names['H'] = 'Home';

const side_names = [];
side_names['N'] = 'North';
side_names['E'] = 'East';
side_names['S'] = 'South';
side_names['W'] = 'West';

const orientation_names = [];
orientation_names['^'] = 'up';
orientation_names['>'] = 'right';
orientation_names['v'] = 'down';
orientation_names['<'] = 'left';

// Helper functions
// Find best matching emoji for given roi
async function emoji_match(src, possible_emoji) {
  let best_match = '?';
  let best_match_score = 0;
  for (let e in possible_emoji) {
    const emoji = possible_emoji[e]; 
    let templ_jimp = await Jimp.read(emoji[1]);
    let templ = cv.matFromImageData(templ_jimp.bitmap);
    let dst = new cv.Mat();
    let mask = new cv.Mat();
    cv.matchTemplate(src, templ, dst, cv.TM_CCOEFF_NORMED, mask);
    let result = cv.minMaxLoc(dst, mask);
    let score = result.maxVal;

    if (score > best_match_score) {
      best_match = emoji[0];
      best_match_score = score;
    }

    templ.delete();
    dst.delete();
    mask.delete();
  }

  return best_match;
}

// Get color values at pixel and compare
function get_rgb_at(src, rc) {
  let pixel = src.ucharPtr(rc[1], rc[0]);
  return [pixel[0], pixel[1], pixel[2]];
}
function rgb_equals(src, dst) {
  return src[0] === dst[0] && src[1] === dst[1] && src[2] === dst[2];
}

// Converter functions from and to graph and grid
function graph_to_grid(x) {
  if (x < 80) {
    if (x >= 40) x = x - 40;
    return [2*(x/5|0), 1+2*(x%5)];
  } else {
    if (x >= 122) x = x - 42;
    x = x - 80;
    return [1+2*(x/6|0), 2*(x%6)];
  }
}
function grid_to_graph(r, c) {
  if (r % 2 === 0) {
    return 5*(r/2|0)+(c/2|0);
  } else {
    return 80+6*(r/2|0)+(c/2|0);
  }
}

// Format instructions array into readable string for output
function instructions_to_text(target) {
  if (target[0] === 'start') {
    return '';
  } else if (target[0] === 'stall') {
    return `Move around for ${target[1]} turns\n`;
  } else {
    return `Go to ${side_names[target[1]].padEnd(5)} of ${attraction_names[target[0]].padEnd(6)} ` +
              `facing ${orientation_names[target[2]].padEnd(5)} in ${target[3]} moves\n`;
  }
}

// Solve date
date_solve.karuta_date_solve = function (channel, image_url) {
  Jimp.read(image_url)
    .then(async (image) => {
      // Create source mat
      let src = cv.matFromImageData(image.bitmap);

      // Build a grid
      let board = [];
      for (let r = 0; r < 15; r++) {
        board[r] = [];
        for (let c = 0; c < 11; c++) {
          if (r%2 === 0) {
            if (c%2 === 0) {
              board[r][c] = '+';
            } else {
              board[r][c] = '-';
            }
          } else {
            if (c%2 === 0) {
              board[r][c] = '|';
            } else {
              board[r][c] = '0';
            }
          }
        }
      }

      // Place attractions 
      let att = 0;
	  const promises = [];
	  const sub_srcs = []
      while (att < 35) {
        const loc = attraction_locations[att];
        let sub_src = new cv.Mat();
        let rect = new cv.Rect(loc[0], loc[1], 32, 32);
        sub_src = src.roi(rect);
		promises.push(emoji_match(sub_src, possible_attractions));
		sub_srcs.push(sub_src);
        att++;
      }
	  att = 0;
	  let gas_count = 0;
	  const best_matches = await Promise.all(promises);
	  while (att < 35) {
		let best_match = best_matches[att];
	    if (best_match === 'G')
          best_match = String.fromCharCode(48 + ++gas_count);
        board[2*((att/5)|0)+1][2*(att%5)+1] = best_match;
		sub_srcs[att].delete();
		att++;
	  }

      // Place vertical roads
      att = 0;
      while (att < 28) {
        const loc = vertical_road_pixels[att];
        const rgb = get_rgb_at(src, loc);
        let road_or_block = '?'; 
        if (rgb_equals(rgb, color_values['road']))
          road_or_block = '|';
        else if (rgb_equals(rgb, color_values['block']))
          road_or_block = ' ';
        board[2*((att/4)|0)+1][2*(att%4)+2] = road_or_block;
        att++;
      }

      // Place horizontal roads
      att = 0;
      while (att < 30) {
        const loc = horizontal_road_pixels[att];
        const rgb = get_rgb_at(src, loc);
        let road_or_block = '?'; 
        if (rgb_equals(rgb, color_values['road']))
          road_or_block = '-';
        else if (rgb_equals(rgb, color_values['block']))
          road_or_block = ' ';
        board[2*((att/5)|0)+2][2*(att%5)+1] = road_or_block;
        att++;
      }

      // Place car
      const rgb = get_rgb_at(src, [373, 575]);
      let starting_location;
      if (rgb_equals(rgb, color_values['back'])) {
        board[14][5] = '>';
        starting_location = 77;
      } else {
        board[14][5] = '<';
        starting_location = 37;
      }

      // Sanity check grid and fill out places of interest
      const attraction_characters = '123TPSJCNMFBLAROHX';
      let attraction_count = {};
      let poi = [];
      for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 11; c++) {
          if (attraction_characters.includes(board[r][c])) {
            if (!attraction_count.hasOwnProperty(board[r][c])) attraction_count[board[r][c]] = 1;
            else attraction_count[board[r][c]]++;
            if (board[r][c] === 'A' || board[r][c] === 'X') continue;
            poi.push([board[r][c], grid_to_graph(r, c-1), 'W', '^']);
            poi.push([board[r][c], grid_to_graph(r, c-1) + 42, 'W', 'v']);
            poi.push([board[r][c], grid_to_graph(r, c+1), 'E', '^']);
            poi.push([board[r][c], grid_to_graph(r, c+1) + 42, 'E', 'v']);
            poi.push([board[r][c], grid_to_graph(r-1, c), 'N', '<']);
            poi.push([board[r][c], grid_to_graph(r-1, c) + 40, 'N', '>']);
            poi.push([board[r][c], grid_to_graph(r+1, c), 'S', '<']);
            poi.push([board[r][c], grid_to_graph(r+1, c) + 40, 'S', '>']);
          }
        }
      }
      let sanity = true;
      if (attraction_count['1'] !== 1) sanity = false;
      if (attraction_count['2'] !== 1) sanity = false;
      if (attraction_count['3'] !== 1) sanity = false;
      if (attraction_count['T'] !== 1) sanity = false;
      if (attraction_count['P'] !== 1) sanity = false;
      if (attraction_count['S'] !== 1) sanity = false;
      if (attraction_count['J'] !== 1) sanity = false;
      if (attraction_count['C'] !== 1) sanity = false;
      if (attraction_count['N'] !== 1) sanity = false;
      if (attraction_count['M'] !== 1) sanity = false;
      if (attraction_count['F'] !== 1) sanity = false;
      if (attraction_count['B'] !== 1) sanity = false;
      if (attraction_count['L'] !== 1) sanity = false;
      if (attraction_count['A'] !== 1) sanity = false;
      if (attraction_count.hasOwnProperty('R') && attraction_count['R'] !== 1) sanity = false;
      if (attraction_count.hasOwnProperty('O') && attraction_count['O'] !== 1) sanity = false;
      if (attraction_count['H'] !== 1) sanity = false;
      if (attraction_count['X'] < 18 || attraction_count['X'] > 20) sanity = false;
      if (!sanity) {
        channel.send('Error parsing image.');
        return;
      }

      // Clear remaining mats
      src.delete();

      // Movement graph
      // Left -> Right -> Up -> Down
      const legal_move = [];
      for (let i = 0; i < 164; i++) {
        legal_move[i] = [];
        for (let j = 0; j < 164; j++) {
          legal_move[i][j] = [];
          if (i === j) legal_move[i][j][0] = 1;
          else legal_move[i][j][0] = 0;
          for (let k = 1; k < 10; k++) {
            legal_move[i][j][k] = 0;
          }
        }
      }

      // Left to Left
      for (let i = 0; i < 40; i++) {
        if (i % 5 === 0) continue;
        legal_move[i][i-1][1] = 1;
      }
      // Left to Up
      for (let i = 0; i < 40; i++) {
        if (i < 5) continue;
        legal_move[i][74+i+(i/5|0)][1] = 1;
      }
      // Left to Down
      for (let i = 0; i < 40; i++) {
        if (i > 34) break;
        legal_move[i][122+i+(i/5|0)][1] = 1;
      }
      // Right to Right
      for (let i = 40; i < 80; i++) {
        if (i % 5 === 4) continue;
        legal_move[i][i+1][1] = 1;
      }
      // Right to Up
      for (let i = 40; i < 80; i++) {
        if (i < 45) continue;
        legal_move[i][35+i+((i-40)/5|0)][1] = 1;
      }
      // Right to Down
      for (let i = 40; i < 80; i++) {
        if (i > 74) break;
        legal_move[i][83+i+((i-40)/5|0)][1] = 1;
      }
      // Up to Up
      for (let i = 80; i < 122; i++) {
        if (i < 86) continue;
        legal_move[i][i-6][1] = 1;
      }
      // Up to Left
      for (let i = 80; i < 122; i++) {
        if (i % 6 === 2) continue;
        legal_move[i][i-81-((i-80)/6|0)][1] = 1;
      }
      // Up to Right
      for (let i = 80; i < 122; i++) {
        if (i % 6 === 1) continue;
        legal_move[i][i-40-((i-80)/6|0)][1] = 1;
      }
      // Down to Down
      for (let i = 122; i < 164; i++) {
        if (i > 157) break;
        legal_move[i][i+6][1] = 1;
      }
      // Down to Left
      for (let i = 122; i < 164; i++) {
        if (i % 6 === 2) continue;
        legal_move[i][i-118-((i-122)/6|0)][1] = 1;
      }
      // Up to Right
      for (let i = 122; i < 164; i++) {
        if (i % 6 === 1) continue;
        legal_move[i][i-77-((i-122)/6|0)][1] = 1;
      }
      
      // Place walls
      for (let r = 0; r < 15; r++) {
        for (let c = 0; c < 11; c++) {
          if (board[r][c] === ' ') {
            let gv1 = grid_to_graph(r, c);
            let gv2 = gv1 + 40;
            if (r % 2 === 1) gv2 = gv2 + 2;
            for (let i = 0; i < 164; i++) {
              legal_move[i][gv1][1] = 0;
              legal_move[i][gv2][1] = 0;
            }
          }
        }
      }

      // Floyd-Warshall(???)
      for (let t = 2; t < 10; t++) {
        for (let a = 0; a < 164; a++) {
          for (let b = 0; b < 164; b++) {
            for (let c = 0; c < 164; c++) {
              if (legal_move[a][b][t-1] && legal_move[b][c][1])
                legal_move[a][c][t] = 1;
            }
          }
        }
      }

      const attraction_boosts = [];
      attraction_boosts['1'] = [100, 0, 0, 0];
      attraction_boosts['2'] = [100, 0, 0, 0];
      attraction_boosts['3'] = [100, 0, 0, 0];
      attraction_boosts['T'] = [0, 60, 0, 0];
      attraction_boosts['P'] = [0, 60, 0, 0];
      attraction_boosts['S'] = [0, 40, 20, 0];
      attraction_boosts['J'] = [0, 0, 60, 0];
      attraction_boosts['C'] = [0, 0, 60, 0];
      attraction_boosts['N'] = [0, 0, 40, 40];
      attraction_boosts['M'] = [0, 0, 0, 60];
      attraction_boosts['F'] = [0, 20, 20, 40];
      attraction_boosts['B'] = [0, -10, -15, 100];
      attraction_boosts['L'] = [0, 0, 0, 100];
      attraction_boosts['R'] = [0, 0, 0, 0];
      attraction_boosts['O'] = [0, 0, 0, 0];
      attraction_boosts['H'] = [0, 0, 0, 0];

      const attraction_indices = [];
      attraction_indices['1'] = 0;
      attraction_indices['2'] = 1;
      attraction_indices['3'] = 2;
      attraction_indices['T'] = 3;
      attraction_indices['P'] = 4;
      attraction_indices['S'] = 5;
      attraction_indices['J'] = 6;
      attraction_indices['C'] = 7;
      attraction_indices['N'] = 8;
      attraction_indices['M'] = 9;
      attraction_indices['F'] = 10;
      attraction_indices['B'] = 11;
      attraction_indices['L'] = 12;
      attraction_indices['R'] = 13;
      attraction_indices['O'] = 14;
      attraction_indices['H'] = 15;

      // Start dfs
      let position = starting_location;
      let stats = [100, 50, 50, 75, 100];
      //            0  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15
      //            1  2  3  T  P  S  J  C  N  M  F  B  L  R  O  H
      let timers = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; 
      let best_score = [-1000, -1000, -1000, -1000];
      let best_route = [];
      let route = [];
      let stack = [];
      stack.push([['start'], position, stats, timers]);

      // Loop
      while (stack.length > 0) {
        let val = stack.pop();
        if (val === 'pop') {
          route.pop();
          continue;
        }
        route.push(val[0]);
        stack.push('pop');
        position = val[1];
        stats = val[2];
        timers = val[3];

        // Go home early
        if (val[0][0] === 'H') {
          let score = Math.ceil((Math.max(0, stats[1]) + Math.max(0, stats[2])
                        + Math.max(0, stats[3]))*(100-stats[4])/600);
          score *= 100;
          score += stats[4];
          if (score > best_score[0]) {
            best_score[0] = score;
            best_route[0] = route.slice();
          }
          if (timers[13] > 0 && score > best_score[1]) {
            best_score[1] = score;
            best_route[1] = route.slice();
          }
          if (timers[14] > 0 && score > best_score[2]) {
            best_score[2] = score;
            best_route[2] = route.slice();
          }
          if (timers[13] > 0 && timers[14] > 0 && score > best_score[3]) {
            best_score[3] = score;
            best_route[3] = route.slice();
          }
          continue;
        }

        // Calculate maximum safe movement
        let max_movement = Math.min(Math.ceil(stats[0]/10), Math.ceil(stats[1]/4),
                                      Math.ceil(stats[2]/6), Math.ceil(stats[3]/8)) - 1;

        // Death score for ring and shopping
        let death_score = -100 + stats[4] - 4*(max_movement+1);
        if (timers[13] > 0) {
          if (death_score > best_score[1]) {
            best_score[1] = death_score;
            best_route[1] = route.slice();
            if (max_movement >= 0) best_route[1].push(['stall', max_movement+1]);
          }
        }
        if (timers[14] > 0) {
          if (death_score > best_score[2]) {
            best_score[2] = death_score;
            best_route[2] = route.slice();
            if (max_movement >= 0) best_route[2].push(['stall', max_movement+1]);
          }
        }
        if (timers[13] > 0 && timers[14] > 0) {
          if (death_score > best_score[3]) {
            best_score[3] = death_score;
            best_route[3] = route.slice();
            if (max_movement >= 0) best_route[3].push(['stall', max_movement+1]);
          }
        }

        // If already dead
        if (max_movement < 0) {
          continue;
        }

        // If timer is low enough
        const time_left = stats[4]/4|0;
        if (time_left <= max_movement) {
          let score = Math.ceil((stats[1] + stats[2] + stats[3] - 18*time_left)/6);
          score *= 100;
          if (score > best_score[0]) {
            best_score[0] = score;
            best_route[0] = route.slice();
            if (time_left > 0) best_route[0].push(['stall', time_left]);
          }
          if (timers[13] > 0 && score > best_score[1]) {
            best_score[1] = score;
            best_route[1] = route.slice();
            if (time_left > 0) best_route[1].push(['stall', time_left]);
          }
          if (timers[14] > 0 && score > best_score[2]) {
            best_score[2] = score;
            best_route[2] = route.slice();
            if (time_left > 0) best_route[2].push(['stall', time_left]);
          }
          if (timers[13] > 0 && timers[14] > 0 && score > best_score[3]) {
            best_score[3] = score;
            best_route[3] = route.slice();
            if (time_left > 0) best_route[3].push(['stall', time_left]);
          }
        }

        // Next search nodes
        max_movement = Math.min(time_left-1, max_movement);
        for (let t = 0; t <= max_movement; t++) {
          for (let p in poi) {
            if (legal_move[position][poi[p][1]][t]) {
              if (t < timers[attraction_indices[poi[p][0]]]) continue;
              let new_position = poi[p][1];
              let new_stats = stats.slice();
              for (let i = 0; i < 4; i++) {
                new_stats[i] += attraction_boosts[poi[p][0]][i];
              }
              new_stats[0] = Math.min(100, new_stats[0] - 10*t);
              new_stats[1] = Math.min(100, new_stats[1] - 4*(t+1));
              new_stats[2] = Math.min(100, new_stats[2] - 6*(t+1));
              new_stats[3] = Math.min(100, new_stats[3] - 8*(t+1));
              new_stats[4] -= 4*(t+1);
              let new_timers = timers.slice();
              for (let i = 0; i < 12; i++) {
                new_timers[i] = Math.max(0, new_timers[i]-(t+1));
              }
              new_timers[attraction_indices[poi[p][0]]] = 10;
              stack.push([[poi[p][0], poi[p][2], poi[p][3], t],
                          new_position, new_stats, new_timers]);
            }
          }
        }
      }

      // Print results
      if (best_score[0] === -1000 && best_score[1] === -1000 && best_score[2] === -1000) {
        await channel.send('🚗✈️🙏');
      } else {
        if (best_score[0] > -1000) {
		  let results_text = '```\n';
          results_text = results_text.concat('💍❌🛍️❌\n');
          for (let i in best_route[0]) {
            results_text = results_text.concat(instructions_to_text(best_route[0][i]));
          }
          let ap_reward = Math.floor(best_score[0]/100);
          results_text = results_text.concat(`Final score: ${ap_reward} AP\n`);
          results_text = results_text.concat('```');
		  await channel.send(results_text);
        }
        if (best_score[1] > -1000) {
		  let results_text = '```\n';
          results_text = results_text.concat('💍✔️🛍️❌\n');
          for (let i in best_route[1]) {
            results_text = results_text.concat(instructions_to_text(best_route[1][i]));
          }
          let ap_reward = Math.floor(best_score[1]/100);
          if (ap_reward < 0) ap_reward = '💀';
          results_text = results_text.concat(`Final score: ${ap_reward} AP\n`);
		  results_text = results_text.concat('```');
		  await channel.send(results_text);
        }
        if (best_score[2] > -1000) {
          let results_text = '```\n';
          results_text = results_text.concat('💍❌🛍️✔️\n');
          for (let i in best_route[2]) {
            results_text = results_text.concat(instructions_to_text(best_route[2][i]));
          }
          let ap_reward = Math.floor(best_score[2]/100);
          if (ap_reward < 0) ap_reward = '💀';
          results_text = results_text.concat(`Final score: ${ap_reward} AP\n`);
		  results_text = results_text.concat('```');
		  await channel.send(results_text);
        }
        if (best_score[3] > -1000) {
		  let results_text = '```\n';
          results_text = results_text.concat('💍✔️🛍️✔️\n');
          for (let i in best_route[3]) {
            results_text = results_text.concat(instructions_to_text(best_route[3][i]));
          }
          let ap_reward = Math.floor(best_score[3]/100);
          if (ap_reward < 0) ap_reward = '💀';
          results_text = results_text.concat(`Final score: ${ap_reward} AP\n`);
		  results_text = results_text.concat('```');
		  await channel.send(results_text);
        }
      }

    }).catch((error) => {
      console.error(error);
      channel.send('Error resolving image.');
    });
}

module.exports = date_solve;
