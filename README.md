## Interactive Clue Solver
An interactive utility that uses [Propositional Logic](https://en.wikipedia.org/wiki/Propositional_calculus) to solve a game of [Clue](https://en.wikipedia.org/wiki/Cluedo).  The utility is hosted [here](https://nstagman.github.io/clue_solver/).

### How to Use it
These examples show the first couple of steps from Nick\'s perspective.

1. Open the **Game Setup** tab.  Select the number of players and enter their names in the order that they will take their turns.

![game_setup](https://github.com/user-attachments/assets/6ebdb7ff-cbe2-4177-97c3-bd87023f7a7e)

> Enter the players names - Order Matters.

2. Open the **Add Cards** tab and enter all the cards that are in your hand.

![add_cards](https://github.com/user-attachments/assets/f1bda6e1-fad0-4d3f-9dde-c35d1ba9811d)

> Add cards from your hand using the **Add Cards** tab.

3. Open the **Add Guess** tab and add every guess that is made during the game (including your own).

![add_guess](https://github.com/user-attachments/assets/9404e1b6-5dd3-4c0c-ade5-e7d21fbd9415)

> For every guess: Add the player making the guess, the 3 cards that are guessed, the refuter, and the refuter\'s card (if known).

When information is added it can be seen in the **Game Knowledge** section.  If incorrect information was accidentally added, it can be removed using the red "X".  The left and right arrows will undo and redo changes made to the **Game Knowledge**.

![cards](https://github.com/user-attachments/assets/fb299823-2735-46f7-b926-be0c048b02f3)

> The **Game Knowledge** section after the cards are added in step 2.

The **Solutions** section shows the known location of each card.

![solutions](https://github.com/user-attachments/assets/fe227f6c-7503-40bf-a499-c0d64b5ea30a)

> The **Solution Section** after the cards are added in step 2.

When a guess is made, both the **Game Knowledge** and **Solutions** sections are updated.

![cards_guessed](https://github.com/user-attachments/assets/841b39a8-51cd-4797-822f-898f440346dd)

> The **Game Knowledge** after the guess that was added in step 3.

The guess shown in step 3 is entered from Nick\'s point of view - we know that Rachel made a guess of "Plum in the Ballroom with the Pipe", and that Holden refuted the guess with an unknown card.  The solver can determine that Holden refuted with the Pipe since we already know where Plum and the Ballroom are.

![guessed_hands](https://github.com/user-attachments/assets/708145ef-5925-47fe-9e8b-020f3d817cd2)

> The **Solutions** after the guess that was added in step 3.


#### Assumptions
Two assumptions are made when a guess is entered:

1. The game did *not* end. The solver assumes that unrefuted guesses do not end the game - meaning that the guesser holds one of the cards that were guessed.
2. A player does *not* hold **all 3** cards of their guess. The solver currently assumes that at least one of the cards from an unrefuted guess are a solution - meaning a player does not make a guess using 3 cards from their own hand.


### How it Works
Propositional Logic and [Resolution](https://en.wikipedia.org/wiki/Resolution_%28logic%29) to determine where each card is located.  There is one Knowledge Base to determine if a card is a Solution, then and additional Knowledge Base for each player to determine what cards that player has in their hand.  This approach means we have to resolve multiple Knowledge Bases, but each Knowledge Base has far fewer atomic formula.

For example: If Nick is known to have the Knife, then the knowledge base for Nick\'s hand would contain the disjunction (**Knife**) and all other knowledge bases would contain (**&not;Knife**).   If we instead used a single knowledge base, then the disjunctions (**NickKnife**) &and; (**&not;RachelKnife**) &and; (**&not;HoldenKnife**) &and; (**&not;SolutionKnife**) would need to be added to the single knowledge base.  This results in a much larger knowledge base containing more "complex" atomic formula.

After information is added to the knowledge bases, resolution is performed, then one more step is done to unify the information amongst all of the knowledge bases.  After resolution each knowlege base is checked to see if their respective players hand is full, as well as checking to see if there is only *one* knowledge base that could hold any particular card.  If any knowledge is inferred from these steps, they are repeated until there are no more changes to any of the knowledge bases.

----
##### When the game is started, the knowledge bases are initialized to the following:

- Solution: (**plum** &or; **scarlet** &or; **mustard** &or; **green** &or; **white** &or; **peacock**) &and; (**wrench** &or; **revolver** &or; **rope** &or; **candlestick** &or; **knife** &or; **pipe**) &and; (**billiard** &or; **ballroom** &or; **study** &or; **lounge** &or; **conservatory** &or; **hall** &or; **library** &or; **kitchen** &or; **dining**)*
- Nick: ()
- Rachel: ()
- Holden: ()

The Solution KB is initialized to hold one Person, Weapon, and Room.  Each player KB is initialized to empty.  Theoretically each player KB should be intialized to a combination of cards equal to the number of cards in their hand, but this would cause the KBs to rapidly grow in size and isnt necessary since we are checking for a full hand in another step outside of resolution.

**In the actual implementation, the Solution KB is initialized with many more disjunctions that enforce the XOR property amongst the 3 sets of cards. Showing this is a bit much for the example.*

----
##### After the initial hand information is added the KBs look like the following:

- Solution: (**plum** &or; **scarlet** &or; **mustard** &or; **green** &or; **white** &or; **peacock**) &and; (**wrench** &or; **revolver** &or; **rope** &or; **candlestick** &or; **knife** &or; **pipe**) &and; (**billiard** &or; **ballroom** &or; **study** &or; **lounge** &or; **conservatory** &or; **hall** &or; **library** &or; **kitchen** &or; **dining**) &and; <mark>(**&not;white**) &and; (**&not;conservatory**) &and; (**&not;ballroom**) &and; (**&not;plum**) &and; (**&not;knife**) &and; (**&not;library**)</mark>
- Nick: (**&not;scarlet**) &and; (**&not;green**) &and; (**&not;kitchen**) &and; (**&not;revolver**) &and; (**&not;rope**) &and; (**knife**) &and; (**&not;mustard**) &and; (**&not;billiard**) &and; (**&not;study**) &and; (**&not;dining**) &and; (**conservatory**) &and; (**white**) &and; (**plum**) &and; (**&not;peacock**) &and; (**ballroom**) &and; (**&not;candlestick**) &and; (**&not;pipe**) &and; (**&not;lounge**) &and; (**&not;wrench**) &and; (**library**) &and; (**&not;hall**)
- Rachel: (**&not;white**) &and; (**&not;conservatory**) &and; (**&not;ballroom**) &and; (**&not;plum**) &and; (**&not;knife**) &and; (**&not;library**)
- Holden: (**&not;white**) &and; (**&not;conservatory**) &and; (**&not;ballroom**) &and; (**&not;plum**) &and; (**&not;knife**) &and; (**&not;library**)

Nick starts the game with White, Conservatory, Ballroom, Plum, Knife, and Library in his hand.  His KB is updated to contain these 6 cards and to not contain the other 12.  The other 3 KBs are updated to not contain the 6 cards in Nick\'s hand.

----
##### When Rachel\'s guess of Plum, Ballroom, and Pipe is refuted by Holden, the KBs are updated to the following:

- Solution: (**plum** &or; **scarlet** &or; **mustard** &or; **green** &or; **white** &or; **peacock**) &and; (**wrench** &or; **revolver** &or; **rope** &or; **candlestick** &or; **knife** &or; **pipe**) &and; (**billiard** &or; **ballroom** &or; **study** &or; **lounge** &or; **conservatory** &or; **hall** &or; **library** &or; **kitchen** &or; **dining**) &and; (**&not;white**) &and; (**&not;conservatory**) &and; (**&not;ballroom**) &and; (**&not;plum**) &and;(**&not;knife**) &and; (**&not;library**) &and; <mark>(**&not;pipe** &or; **&not;plum** &or; **&not;ballroom**) &and; (**&not;pipe**)</mark>
- Nick: (**&not;scarlet**) &and; (**&not;green**) &and; (**&not;kitchen**) &and; (**&not;revolver**) &and; (**&not;rope**) &and; (**knife**) &and; (**&not;mustard**) &and; (**&not;billiard**) &and; (**&not;study**) &and; (**&not;dining**) &and; (**conservatory**) &and; (**white**) &and; (**plum**) &and; (**&not;peacock**) &and; (**ballroom**) &and; (**&not;candlestick**) &and; (**&not;pipe**) &and; (**&not;lounge**) &and; (**&not;wrench**) &and; (**library**) &and; (**&not;hall**) &and; <mark>(**&not;pipe** &or; **&not;plum** &or; **&not;ballroom**)</mark>
- Rachel: (**&not;white**) &and; (**&not;conservatory**) &and; (**&not;ballroom**) &and; (**&not;plum**) &and; (**&not;knife**) &and; (**&not;library**) &and; <mark>(**&not;pipe** &or; **&not;plum** &or; **&not;ballroom**) &and; (**&not;pipe**)</mark>
- Holden: (**&not;white**) &and; (**&not;conservatory**) &and; (**&not;ballroom**) &and; (**&not;plum**) &and; (**&not;knife**) &and; (**&not;library**)) &and; <mark>(**plum** &or; **ballroom** &or; **pipe**) &and; (**pipe**)</mark>

After the guess, the disjunction (**&not;pipe** &or; **&not;plum** &or; **&not;ballroom**) is added to the Solution, Nick\'s, and Rachel\'s KBs along with the disjunction (**plum** &or; **ballroom** &or; **pipe**) being added to Holden\'s KB since we know that one of these cards belongs to Holden. The knowledge bases now have enough information to infer more knowledge.

During resolution of Holden\'s KB, we find that the KB entails **pipe**. To see this, we take the current KB and add the clause (**&not;pipe**).  Then repeatedly remove complementary literals.

(**&not;white**) &and; (**&not;conservatory**) &and; (**&not;ballroom**) &and; (**&not;plum**) &and; (**&not;knife**) &and; (**&not;library**)) &and; (**plum** &or; **ballroom** &or; **pipe**) &and; <mark>(**&not;pipe**)</mark>

---
(**&not;white**) &and; (**&not;conservatory**) &and; (**&not;ballroom**) &and; (**&not;plum**) &and; (**&not;knife**) &and; (**&not;library**)) &and; (**plum** &or; **ballroom** &or; <mark><s>**pipe**</s></mark>) &and; <mark>(**&not;pipe**)</mark>

---
(**&not;white**) &and; (**&not;conservatory**) &and; <mark>(**&not;ballroom**)</mark> &and; (**&not;plum**) &and; (**&not;knife**) &and; (**&not;library**)) &and; (**plum** &or; <mark><s>**ballroom**</s></mark> &or; <s>**pipe**</s>) &and; (**&not;pipe**)

---
(**&not;white**) &and; (**&not;conservatory**) &and; (**&not;ballroom**) &and; <mark>(**&not;plum**)</mark> &and; (**&not;knife**) &and; (**&not;library**)) &and; (<mark><s>**plum**</s></mark> &or; <s>**ballroom**</s> &or; <s>**pipe**</s>) &and; (**&not;pipe**)

All the literals have been removed from the clause (<s>**plum**</s> &or; <s>**ballroom**</s> &or; <s>**pipe**</s>), leaving the empty clause ().  This means that (**&not;pipe**) is contradictory in this KB, proving that the KB entails **pipe**. 

Since Holden\'s KB entails pipe, (**pipe**) is added to Holdens KB and (**&not;pipe**) is added to all the others.


### Implementation Notes

Atomic literals are represented by Maps with keys for the name and the 'truthiness' of the literal.  Disjunctions are represented by Sets of atomics.  Knowledge Bases are represented by Sets of disjunctions.  Each object is memoized when created, this means that logically equivalent structures will always reference the same object, which allows the set operations to work as expected.

I originally wrote this logic in Python using named tuples to represent atomic literals, frozen sets to represent disjunctions and sets to represent the knowledge bases.  The immutability of the data made the logic easier to reason about.  When transposing this to typescript I initially used Records and Sets from Immutable.js as replacements for the named tuples and frozen sets.  This performed very poorly (orders of magnitude worse than the python implementation) when iterating through the structures during resolution. It is possible I was using Immutable.js incorrectly, but I ended up swapping to the strategy using built-in Maps and Sets with memoization to remove the performance issues.

[SolidJS](https://www.solidjs.com/) was used to give the user interface its reactivity.
