import React from 'react';

interface HandRanking {
  rank: number;
  name: string;
  description: string;
  example: string;
  cards: string[];
}

export function HandRankings() {
  const hands: HandRanking[] = [
    {
      rank: 1,
      name: 'Royal Flush',
      description: 'A, K, Q, J, 10, all the same suit',
      example: 'A♠ K♠ Q♠ J♠ 10♠',
      cards: ['A♠', 'K♠', 'Q♠', 'J♠', '10♠']
    },
    {
      rank: 2,
      name: 'Straight Flush',
      description: 'Five cards in a sequence, all the same suit',
      example: '9♥ 8♥ 7♥ 6♥ 5♥',
      cards: ['9♥', '8♥', '7♥', '6♥', '5♥']
    },
    {
      rank: 3,
      name: 'Four of a Kind',
      description: 'All four cards of the same rank',
      example: 'K♣ K♥ K♦ K♠ 3♥',
      cards: ['K♣', 'K♥', 'K♦', 'K♠', '3♥']
    },
    {
      rank: 4,
      name: 'Full House',
      description: 'Three of a kind with a pair',
      example: 'Q♠ Q♥ Q♦ 7♣ 7♦',
      cards: ['Q♠', 'Q♥', 'Q♦', '7♣', '7♦']
    },
    {
      rank: 5,
      name: 'Flush',
      description: 'Any five cards of the same suit, not in sequence',
      example: 'J♦ 9♦ 7♦ 5♦ 2♦',
      cards: ['J♦', '9♦', '7♦', '5♦', '2♦']
    },
    {
      rank: 6,
      name: 'Straight',
      description: 'Five cards in sequence, different suits',
      example: '10♠ 9♣ 8♥ 7♦ 6♠',
      cards: ['10♠', '9♣', '8♥', '7♦', '6♠']
    },
    {
      rank: 7,
      name: 'Three of a Kind',
      description: 'Three cards of the same rank',
      example: '8♣ 8♥ 8♦ K♠ 4♣',
      cards: ['8♣', '8♥', '8♦', 'K♠', '4♣']
    },
    {
      rank: 8,
      name: 'Two Pair',
      description: 'Two different pairs',
      example: 'A♠ A♣ J♥ J♦ 9♠',
      cards: ['A♠', 'A♣', 'J♥', 'J♦', '9♠']
    },
    {
      rank: 9,
      name: 'One Pair',
      description: 'Two cards of the same rank',
      example: '10♥ 10♣ K♠ 6♦ 2♥',
      cards: ['10♥', '10♣', 'K♠', '6♦', '2♥']
    },
    {
      rank: 10,
      name: 'High Card',
      description: 'When you have no matching cards',
      example: 'A♠ J♦ 9♣ 6♥ 3♠',
      cards: ['A♠', 'J♦', '9♣', '6♥', '3♠']
    }
  ];

  const getCardColor = (card: string): string => {
    if (card.includes('♥') || card.includes('♦')) {
      return 'text-red-500';
    }
    return 'text-black';
  };

  const getRankGradient = (rank: number): string => {
    if (rank === 1) return 'from-yellow-400 to-yellow-600';
    if (rank <= 3) return 'from-purple-400 to-purple-600';
    if (rank <= 5) return 'from-blue-400 to-blue-600';
    if (rank <= 7) return 'from-green-400 to-green-600';
    return 'from-gray-400 to-gray-600';
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">Texas Hold'em Hand Rankings</h2>
        <p className="text-foreground-muted">
          Learn the poker hand rankings from highest to lowest
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {[...hands].reverse().map((hand) => (
          <div
            key={hand.rank}
            className="bg-background border border-background-lightest rounded-lg p-5 hover:border-poker-500/50 transition-all duration-200 shadow-lg hover:shadow-glow-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getRankGradient(hand.rank)} flex items-center justify-center text-white font-bold shadow-md`}>
                    {hand.rank}
                  </div>
                  <h3 className="text-xl font-bold text-foreground">
                    {hand.name}
                  </h3>
                </div>
                <p className="text-sm text-foreground-muted mt-2 ml-13">
                  {hand.description}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center p-4 bg-background-lighter rounded-lg border border-background-lightest">
              {hand.cards.map((card, idx) => (
                <div
                  key={idx}
                  className="w-14 h-20 bg-white rounded-lg shadow-md flex items-center justify-center text-2xl font-bold border-2 border-gray-200 hover:scale-105 transition-transform"
                >
                  <span className={getCardColor(card)}>{card}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-background border border-poker-500/30 rounded-lg p-6 mt-8">
        <h3 className="text-xl font-bold text-foreground mb-3 flex items-center space-x-2">
          <span>💡</span>
          <span>Quick Tips</span>
        </h3>
        <ul className="space-y-2 text-foreground-muted">
          <li className="flex items-start space-x-2">
            <span className="text-poker-500 mt-1">•</span>
            <span>The best possible hand is a Royal Flush - it's unbeatable!</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-poker-500 mt-1">•</span>
            <span>If two players have the same hand rank, the one with higher cards wins</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-poker-500 mt-1">•</span>
            <span>In Texas Hold'em, you make the best 5-card hand from your 2 hole cards and 5 community cards</span>
          </li>
          <li className="flex items-start space-x-2">
            <span className="text-poker-500 mt-1">•</span>
            <span>An Ace can be high (A-K-Q-J-10) or low (5-4-3-2-A) in a straight</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
