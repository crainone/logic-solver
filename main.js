'use strict'

/**
 * logic-solver
 * @author Caitlin Rainone
 * @date 2017-08-17
 *
 * Grid logic puzzles are available at http://www.logic-puzzles.org, and are 
 * clearly being procedurally generated. What I want to know is whether it's 
 * possible to also solve them procedurally.
 * 
 * Grid logic puzzles (TODO: make this number editable) describe 7 Things. 
 * Each Thing has 4 Properties to be determined, such that for each possible 
 * Value of the Property, it belongs to exactly one Thing. So for instance,
 * 
 * Towns
 * ------
 * town			low temps	high temps	snowfall
 * Carthage		8 degrees	25 degrees	1 inch
 * Garberville	10 degrees	27 degrees	2 inches
 * Lindsay		11 degrees	28 degrees	3 inches
 * Oxford		12 degrees	30 degrees	4 inches
 * Quimby		15 degrees	31 degrees	5 inches
 * Wayland		18 degrees	32 degrees	6 inches
 * Zearing		19 degrees	34 degrees	7 inches
 * 
 * Of the Things that are the towns, they have the Properties name, low 
 * temperature, high temperature, and snowfall. Each Property has 7 values, 
 * one of each to be assigned to the towns. In addition, there are a certain 
 * number of Clues that rule out what values can be assigned to which town. 
 * Once all Clues are satisfied, there should be only one way to describe all 
 * 7 towns.
 * 
 * Specific to this particular instantiation of logic puzzles, one Property is 
 * special: it is the Key, and all Things are referred to as {key}s. So in 
 * this case, the property Town is the key, and all the clues refer to towns 
 * (with such-and-such a property). Also, exactly one of the clues is Ranked, 
 * and might have quantitative clues about it. Even though all of the non-key 
 * properties in this example are numeric, only Snowfall is Ranked, so towns 
 * will only get clues about having more or less snowfall than another, rather 
 * than clues about a higher or lower temperature.
 */
 
 
 
 /****************************************************************************
  * 
  * Clues
  * Use the text provided to create Conditions (below)
  * 
  ****************************************************************************
  
/**
 * Clues are provided by the server in one of several different formats.
 */ 
class Clue {}

/**
 * The AllDifferentClue is of the form "N1, N2, ... N(x-1) and N(x) are all 
 * different C." Ns may be in different categories. They can be interpreted as 
 * a x/2 array of edges to be disabled.
 * NIsNotM(N1, N2)
 * NIsNotM(N1, N3)
 * ...
 * NIsNotM(N2, N3)
 * ...
 * NIsNotM(N(x-1), N(x))
 */
class AllDifferentClue extends Clue {}

/**
 * The OfNAndMClue is of the form "Of N1 and N2, one N3 and one N4".
 * They can be interpreted as two disabled edges (because N1 and N2 can't 
 * match, or N3 and N4) and four Or conditions.
 * NIsNotM(N1, N2)
 * NIsNotM(N3, N4)
 * NOrM({N1, N3}, {N1, N4})
 * NOrM({N2, N3}, {N2, N4})
 * NOrM({N1, N3}, {N2, N3})
 * NOrM({N1, N4}, {N2, N4})
 */
class OfNAndMClue extends Clue {}

/**
 * The SomewhatLessClue is of the form "N1 will get somewhat less 
 * (RankedProperty) than N2." It can also be in the form "N2 will get somewhat 
 * more (RankedProperty) than N1.", which is equivalent.
 * It gets its own condition: each of the edges (N1, R1) to (N1, R6) is 
 * watching the group of edges (N2, >R) for all of them to be eliminated. In 
 * that case it disqualifies itself. Similarly, N2 is watching links of N1.
 * NIsNotM(N1, R7)
 * NIsNotM(N2, R1)
 * NIsLessThanM(N1, N2)
 */
class SomewhatLessClue extends Clue {}

/**
 * The XLessClue is of the form "N1 will get X less (RankedProperty) than N2", 
 * or "N2 will get X more (RankedProperty) than N1". Link {N1, R1} will start 
 * watching {N2, R(X+1)}, link {N1, R2} will start watching {N2, R(X+2)}, etc. 
 * Also link {N2, R7} will start watching {N1, R(7-X)}, etc. All links that 
 * can't match up that way are eliminated.
 * Where X=1:
 * NIsNotM(N1, R7)
 * NIsNotM(N2, R1)
 * BothOrNeither({N1, R1}, {N2, R2})
 * BothOrNeither({N1, R2}, {N2, R3})
 * ...
 * BothOrNeither({N1, R6}, {N2, R7})
 */
class XLessClue extends Clue{}

/**
 * Sometimes the clue is directly that N1 is not N2. This is just a wrapper 
 * for that relationship.
 * NIsNotM(N1, N2)
 */
class NIsNotMClue extends Clue {}

/**
 * Sometimes the clue is directly that N1 is N2. This is just a wrapper for 
 * that relationship.
 * NIsM(N1, N2)
 */
class NIsMClue extends Clue {}



 /****************************************************************************
  * 
  * The Game Board
  * 
  ****************************************************************************

/**
 * Assume there's a set of permutations (key-ranked-1-2) where key values are 
 * ABCDEFG, ranked values are JKLMNOP, property 1 values are TUVWXYZ, and 
 * property 2 values are 1234567.
 * Then, you could describe the puzzle as one node for every value:
 *
 * A	B	C	D	E	F	G
 *
 * J	K	L	M	N	O	P
 *
 * T	U	V	W	X	Y	Z
 *
 * 1	2	3	4	5	6	7
 * 
 * With one edge running between every node *except* the ones in its own row. 
 * An edge between A and J means "key=A and ranked=J" is a possibility, no 
 * matter the eventual values of property 1 and property 2. Since "key=A and 
 * key=B" is forbidden by the rules of the puzzle, it's removed ahead of time. 
 * A completed puzzle will be 7 disconnected graphs of 4 nodes each.
 * This is true for every puzzle that ever existed. The clues remove 
 * particular edges from this space of possible objects. If there is only one 
 * value left for a particular key, that is an equality and the nodes become 
 * one node. A finished solution only contains 4 disconnected nodes. 
 * For instance, a clue
 *		"Of Carthage and the town that got 4 inches of snow, one had a high of 
 * 			31 degrees and one had a low of 19 degrees"
 * 		new OfNAndMClue('Carthage', '4 inches', '31 degrees', '19 degrees')
 *		[
 * 			new NIsNotM('Carthage', '4 inches'), 
 *			new NIsNotM('31 degrees', '19 degrees'), 
 *			new NIsMClue('Carthage', ['31 degrees', '19 degrees']),
 *			new NIsMClue('4 inches', ['31 degrees', '19 degrees']),
 *			new NIsMClue('31 degrees', ['Carthage', '4 inches']),
 *			new NIsMClue('19 degrees', ['Carthage', '4 inches'])
 * 		]
 * NIsNotM will remove the edge between the given nodes. The NIsMClue actually 
 * describes a different relationship. Look at the first one: 
 * new NIsMClue('Carthage', ['31 degrees', '19 degrees']). 
 * *If* Carthage had a high of 31 degrees, Carthage didn't have a high of a 
 * different temperature, *or* a low of 19 (but it still must have a low of 
 * some temperature in order to complete the puzzle). *Otherwise*, Carthage 
 * had a high of some temperature other than 31, but it had a low of 19. This 
 * should be represented as adding Conditions to the graph:
 *
 * (Carthage = A, 31 degrees = T, 19 degrees = 1)
 *
 * Graph:
 * A-+-+ B	C	D	E	F	G
 *   | |
 * T-+ | U	V	W	X	Y	Z
 *     |
 * 1---+ 2	3	4	5	6	7
 * 
 * A and T are connected by edge AT. A and 1 are connected by edge A1. To 
 * represent the new clue, AT has a condition to watch edge A1 - if it goes 
 * away, it knows it is definitely in the final graph. The same goes for A1 
 * watching AT.
 * All edges start with two conditions: For every edge, for instance GZ, has a 
 * condition watching edges GT, GU, GV, GW, GX, and GY. If they all go away, 
 * it knows it is definitely in the final graph. Also, the reverse can be 
 * true. GZ is also watching GT, GU, GV, GW, GX, and GY for if one of them 
 * determines themselves they are in the final graph. If so, GZ is definitely 
 * NOT in the final graph.
 *
 */

class Condition {
	constructor(evaluation, response) {
		this.evaluation = evaluation;
		this.response = response;
	}
	
	evaluate(link) {
		if(evaluation(link)) return response;
		return 'maybe';
	}
}

class AlreadyFoundCondition extends Condition {
	constructor(group) {
		let evaluation = function(link) {
			return group
				.map(otherLink => link != otherLink && link.value == 'yes')
				.reduce((a,b) => a || b);
		};
		
		super(evaluation, 'no');
	}
}

class EliminationCondition extends Condition {
	constructor(group) {
		let evaluation = function(link) {
			return group
				.map(otherLink => link == otherLink || link.value == 'no')
				.reduce((a,b) => a && b);
		};
		
		super(evaluation, 'yes');
	}
}

class Link {
	constructor(value1, value2) {
		this.A = value1;
		this.B = value2;
		this.conditions = [];
		this.value = 'maybe';
	}
	
	evaluate() {
		if(this.value != 'maybe') return this.value;
		for(let condition in conditions) {
			let response = condition.evaluate(this);
			if(response != 'maybe') return this.value = response; //one of the conditions resolved
		}
		return this.value; //='maybe'
	}
}

class GameBoard() {
	//This should be configurable, ex. '1' is 'Cranston'
	var propertyValues = {
		typeof KeyValue : { 
			classConstructor: KeyValue, 
			valueSet: ['A','B', 'C', 'D', 'E', 'F', 'G'], 
			objectSet: [] },
		typeof RankedValue : { 
			classConstructor: RankedValue, 
			valueSet: [1,2,3,4,5,6,7], 
			objectSet: [] },
		typeof Prop1Value : { 
			classConstructor: Prop1Value, 
			valueSet: ['a', 'b', 'c', 'd', 'e', 'f', 'g'], 
			objectSet: [] },
		typeof Prop2Value : { 
			classConstructor: Prop2Value, 
			valueSet: ['z', 'y', 'x', 'w', 'v', 'u', 't'], 
			objectSet: [] }
	}
	
	var links = {
		typeof KeyValue : {
			typeof RankedValue : [],
			typeof Prop1Value : [],
			typeof Prop2Value : []
		},
		typeof RankedValue : {
			typeof Prop1Value : [],
			typeof Prop2Value : []
		},
		typeof Prop1Value : {
			typeof Prop2Value : []
		}
	}
	
	//For each property, use that constructor on each of the possible values
	propertyValues.forEach(
		prop => prop.objectSet = prop.valueSet.map(
			propValue => new prop.classConstructor(propValue)
		)
	);
	
	//For each property value, make a link to all possible matches
	propertyValues.forEach(
		propertyType => propertyValues.forEach(
			otherPropertyType => ordered(propertyType, otherPropertyType) && propertyType.objectSet.forEach(
				propertyValue => otherPropertyType.objectSet.forEach(
					otherPropertyValue => {
						let link = new Link(propertyValue, otherPropertyValue);
						propertyValue.links.push(link);
						otherPropertyValue.links.push(link);
						links.propertyType.otherPropertyType.push(link);
					}
				)
			)
		)
	);
	
	//For each group of links, one condition is that if any other in the group 
	//is 'yes', it must be 'no'. If all others in the group are 'no', it must 
	//be 'yes'. Set up those conditions and apply to the relevant links
	links.forEach(
		endpoint => endpoint.forEach(
			otherEndpoint => {
				let foundCondition = new AlreadyFoundCondition(otherEndpoint);
				let eliminatedCondition = new EliminationCondition(otherEndpoint);
				otherEndpoint.forEach(
					link => link.conditions.push(foundCondition, eliminatedCondition)
				)
			}
		)
	)
}

 /****************************************************************************
  * 
  * Utility Functions
  * 
  ****************************************************************************/
  
function intersection(a, b) {
	if(typeof a != 'array') return a;
	if(typeof b != 'array') return b;
	
	return a.filter(function(n) {
		return b.indexOf(n) !== -1;
	});
}

function union(a, b) {
	return [...new Set([...a, ...b])];
}

function solve() {
	let game = new GameBoard();
}
