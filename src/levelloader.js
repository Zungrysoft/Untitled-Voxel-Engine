import * as level1 from './levels/test1.js'
import * as fanIntro from './levels/fanIntro.js'
import * as fanPushesFan from './levels/fanPushesFan.js'
import * as stacking from './levels/stacking.js'
import * as intro from './levels/intro.js'
import * as shuffle from './levels/shuffle.js'
import * as sorting from './levels/sorting.js'
import * as plinko from './levels/plinko.js'
import * as zapYourProblems from './levels/zapYourProblems.js'
import * as fantastic from './levels/fantastic.js'
import * as laserIntro from './levels/laserIntro.js'
import * as simpleFans from './levels/simpleFans.js'
import * as twoTowers from './levels/twoTowers.js'
import * as rotatorTest from './levels/rotatorTest.js'

export function getLevel(lvl) {
  // Retrieve level data
  const levelList = [
    rotatorTest,
    fanIntro,
    stacking,
    fanPushesFan,
    simpleFans,
    shuffle,
    sorting,
    laserIntro,
    fantastic,
    twoTowers,
    plinko,
    zapYourProblems,
    level1,
    level1,
    level1,
    level1,
    level1,
    level1,
    level1,
    level1,
    level1,
    level1,
  ]
  const ret = JSON.parse(JSON.stringify(levelList[lvl-1].data))
  return ret
}

