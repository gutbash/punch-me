import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
  PanResponder,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { getCards } from '@/lib/storage';
import { LoyaltyCard } from '@/lib/types';

const { width: screenWidth } = Dimensions.get('window');

interface WalletCardProps {
  card: LoyaltyCard;
  index: number;
  totalCards: number;
  currentIndex: number;
  onPress: () => void;
}

const WalletCardComponent: React.FC<WalletCardProps> = ({ 
  card, 
  index, 
  totalCards, 
  currentIndex,
  onPress 
}) => {
  const progress = (card.punches / card.goal) * 100;
  const isComplete = card.punches >= card.goal;
  
  // Calculate position relative to current index
  const relativeIndex = index - currentIndex;
  const isVisible = Math.abs(relativeIndex) <= 3; // Show more cards for animation
  
  if (!isVisible) return null;
  
  // Calculate stacking effect based on relative position
  const baseStackOffset = Math.min(Math.abs(relativeIndex) * 8, 32);
  const scale = 1 - (Math.abs(relativeIndex) * 0.015);
  const opacity = relativeIndex === 0 ? 1 : 0.8 - (Math.abs(relativeIndex) * 0.2);
  
  // Animation values
  const animatedTranslateX = useRef(new Animated.Value(0)).current;
  const animatedTranslateY = useRef(new Animated.Value(baseStackOffset)).current;
  const animatedScale = useRef(new Animated.Value(scale)).current;
  const animatedOpacity = useRef(new Animated.Value(opacity)).current;
  const animatedZIndex = useRef(new Animated.Value(totalCards - Math.abs(relativeIndex))).current;
  
  // Animate deck movement when position changes
  useEffect(() => {
    const isCurrentCard = relativeIndex === 0;
    const isInFront = relativeIndex < 0;
    const isBehind = relativeIndex > 0;
    
    if (isCurrentCard) {
      // Current card - bring to front
      Animated.parallel([
        Animated.timing(animatedTranslateX, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(animatedTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(animatedScale, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(animatedOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (isBehind) {
      // Cards behind - stack them properly
      Animated.parallel([
        Animated.timing(animatedTranslateX, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(animatedTranslateY, {
          toValue: baseStackOffset,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(animatedScale, {
          toValue: scale,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(animatedOpacity, {
          toValue: opacity,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (isInFront) {
      // Cards that were in front - slide them behind the deck
      const direction = relativeIndex < -1 ? -1 : 1; // Determine slide direction
      
      Animated.sequence([
        // Slide out to the side and behind
        Animated.parallel([
          Animated.timing(animatedTranslateX, {
            toValue: direction * screenWidth * 0.3,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(animatedTranslateY, {
            toValue: baseStackOffset + 20, // Move further behind
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(animatedScale, {
            toValue: scale * 0.9,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(animatedOpacity, {
            toValue: 0.3,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
        // Slide back to position behind deck
        Animated.parallel([
          Animated.timing(animatedTranslateX, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(animatedTranslateY, {
            toValue: baseStackOffset,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(animatedScale, {
            toValue: scale,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(animatedOpacity, {
            toValue: opacity,
            duration: 200,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [relativeIndex, baseStackOffset, scale, opacity]);
  
  // Generate a color based on card name for consistency
  const getCardColor = (name: string) => {
    const colors = [
      '#3B82F6', // blue
      '#EF4444', // red
      '#10B981', // green
      '#F59E0B', // amber
      '#8B5CF6', // purple
      '#F97316', // orange
      '#06B6D4', // cyan
      '#84CC16', // lime
    ];
    const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        {
          opacity: animatedOpacity,
          zIndex: totalCards - Math.abs(relativeIndex),
          transform: [
            { translateX: animatedTranslateX },
            { translateY: animatedTranslateY },
            { scale: animatedScale },
          ],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: getCardColor(card.name) }
        ]}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardIcon}>
            <Text style={styles.cardIconText}>🏪</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName}>{card.name}</Text>
            <Text style={styles.cardProgress}>
              {card.punches}/{card.goal} punches
            </Text>
          </View>
          {isComplete && (
            <View style={styles.readyBadge}>
              <Text style={styles.readyBadgeText}>Ready!</Text>
            </View>
          )}
        </View>
        
        <View style={styles.progressBarContainer}>
          <View 
            style={[
              styles.progressBar,
              { width: `${Math.min(progress, 100)}%` }
            ]} 
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

interface ExpandedCardModalProps {
  card: LoyaltyCard;
  visible: boolean;
  onClose: () => void;
  onNavigateToCard: () => void;
}

const ExpandedCardModal: React.FC<ExpandedCardModalProps> = ({
  card,
  visible,
  onClose,
  onNavigateToCard,
}) => {
  const progress = (card.punches / card.goal) * 100;
  const isComplete = card.punches >= card.goal;

  const getCardColor = (name: string) => {
    const colors = [
      '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
      '#8B5CF6', '#F97316', '#06B6D4', '#84CC16',
    ];
    const hash = name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: getCardColor(card.name) }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <View style={styles.modalCardHeader}>
            <View style={styles.modalCardIcon}>
              <Text style={styles.modalCardIconText}>🏪</Text>
            </View>
            <View>
              <Text style={styles.modalCardName}>{card.name}</Text>
              <Text style={styles.modalCardSubtitle}>Loyalty Card</Text>
            </View>
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Progress</Text>
              <Text style={styles.progressText}>
                {card.punches}/{card.goal}
              </Text>
            </View>
            <View style={styles.modalProgressBarContainer}>
              <View 
                style={[
                  styles.modalProgressBar,
                  { width: `${Math.min(progress, 100)}%` }
                ]} 
              />
            </View>
          </View>

          {card.rewardDescription && (
            <View style={styles.rewardSection}>
              <Text style={styles.rewardTitle}>Reward</Text>
              <Text style={styles.rewardDescription}>{card.rewardDescription}</Text>
            </View>
          )}

          {isComplete && (
            <View style={styles.completeBadge}>
              <Text style={styles.completeEmoji}>🎉</Text>
              <Text style={styles.completeTitle}>Ready to Redeem!</Text>
              <Text style={styles.completeSubtitle}>
                Show this card to claim your reward
              </Text>
            </View>
          )}

          <View style={styles.punchGrid}>
            {Array.from({ length: card.goal }, (_, i) => (
              <View
                key={i}
                style={[
                  styles.punchCell,
                  i < card.punches ? styles.punchCellFilled : styles.punchCellEmpty
                ]}
              >
                <Text
                  style={[
                    styles.punchCellText,
                    i < card.punches ? styles.punchCellTextFilled : styles.punchCellTextEmpty
                  ]}
                >
                  {i < card.punches ? '✓' : i + 1}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.detailButton}
            onPress={onNavigateToCard}
          >
            <Text style={styles.detailButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const AddCard: React.FC = () => {
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  const [expandedCard, setExpandedCard] = useState<LoyaltyCard | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const loadCards = async () => {
      const loadedCards = await getCards();
      setCards(loadedCards);
    };
    
    loadCards();
    
    // Only refresh cards when coming back from scanner, not constantly
    // This prevents blank cards from disappearing
    // const interval = setInterval(loadCards, 2000);
    // return () => clearInterval(interval);
  }, []);

  // Create pan responder for swipe gestures
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return Math.abs(gestureState.dx) > 20 && Math.abs(gestureState.dy) < 100;
    },
    onPanResponderMove: (evt, gestureState) => {
      // You can add real-time card movement here if desired
    },
    onPanResponderRelease: (evt, gestureState) => {
      const { dx } = gestureState;
      const threshold = 50;
      
      if (dx > threshold && currentIndex > 0) {
        // Swipe right - go to previous card
        setCurrentIndex(currentIndex - 1);
      } else if (dx < -threshold && currentIndex < cards.length - 1) {
        // Swipe left - go to next card
        setCurrentIndex(currentIndex + 1);
      }
    },
  });

  // Reset current index when cards change
  useEffect(() => {
    if (currentIndex >= cards.length && cards.length > 0) {
      setCurrentIndex(0);
    }
  }, [cards.length, currentIndex]);

  const handleAddCard = () => {
    // Create a blank card that persists until refresh
    const newCard: LoyaltyCard = {
      id: Date.now().toString(),
      establishmentId: Date.now().toString(),
      name: `Business ${cards.length + 1}`,
      punches: 0,
      goal: 10,
      rewardDescription: 'Special Reward',
      walletPassUrl: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Add the new card to local state - it will persist until app refresh
    setCards([newCard, ...cards]);
    
    // To use QR scanner instead, replace above with:
    // router.push('/scan');
  };

  const handleCardPress = (card: LoyaltyCard) => {
    setExpandedCard(card);
  };

  const handleNavigateToCard = () => {
    if (expandedCard) {
      setExpandedCard(null);
      router.push({ pathname: '/card/[id]', params: { id: expandedCard.id } });
    }
  };

  const stackHeight = cards.length > 0 ? 250 : 0;

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.walletIcon}>👛</Text>
          <ThemedText type="title">Wallet</ThemedText>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddCard}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      {cards.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>👛</Text>
          <ThemedText type="subtitle" style={styles.emptyTitle}>
            No Cards Yet
          </ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Add your first loyalty card to get started
          </ThemedText>
          <TouchableOpacity style={styles.emptyAddButton} onPress={handleAddCard}>
            <Text style={styles.emptyAddButtonText}>Add Card</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.walletContainer}>
          <View 
            style={[styles.cardsContainer, { height: stackHeight }]}
            {...panResponder.panHandlers}
          >
            {cards.map((card, index) => (
              <WalletCardComponent
                key={card.id}
                card={card}
                index={index}
                currentIndex={currentIndex}
                totalCards={cards.length}
                onPress={() => handleCardPress(card)}
              />
            ))}
          </View>
          
          {/* Card indicator dots */}
          <View style={styles.indicatorContainer}>
            {cards.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.indicator,
                  index === currentIndex && styles.indicatorActive
                ]}
                onPress={() => setCurrentIndex(index)}
              />
            ))}
          </View>
          
          {/* Swipe instruction */}
          {cards.length > 1 && (
            <View style={styles.swipeInstruction}>
              <ThemedText style={styles.swipeText}>
                Swipe left or right to browse cards
              </ThemedText>
            </View>
          )}
        </View>
      )}

      {cards.length > 0 && (
        <View style={styles.footer}>
          <ThemedText style={styles.footerText}>
            {cards.length} card{cards.length !== 1 ? 's' : ''} in wallet
          </ThemedText>
        </View>
      )}

      {expandedCard && (
        <ExpandedCardModal
          card={expandedCard}
          visible={!!expandedCard}
          onClose={() => setExpandedCard(null)}
          onNavigateToCard={handleNavigateToCard}
        />
      )}
    </ThemedView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 32,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  walletIcon: {
    fontSize: 28,
  },
  addButton: {
    width: 40,
    height: 40,
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  emptyAddButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  emptyAddButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  walletContainer: {
    flex: 1,
  },
  cardsContainer: {
    position: 'relative',
    width: '100%',
  },
  cardContainer: {
    position: 'absolute',
    width: '100%',
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    gap: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  indicatorActive: {
    backgroundColor: '#3B82F6',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  swipeInstruction: {
    marginTop: 16,
    alignItems: 'center',
  },
  swipeText: {
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
  },
  card: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardIcon: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardIconText: {
    fontSize: 20,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cardProgress: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  readyBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  readyBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 4,
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  footerText: {
    opacity: 0.6,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    padding: 20,
  },
  modalHeader: {
    alignItems: 'flex-end',
    marginBottom: 20,
    paddingTop: 20,
  },
  closeButton: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    flex: 1,
  },
  modalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  modalCardIcon: {
    width: 48,
    height: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  modalCardIconText: {
    fontSize: 24,
  },
  modalCardName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalCardSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
  },
  progressSection: {
    marginBottom: 24,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  progressText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalProgressBarContainer: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  modalProgressBar: {
    height: '100%',
    backgroundColor: 'white',
    borderRadius: 6,
  },
  rewardSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  rewardTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  rewardDescription: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
  },
  completeBadge: {
    backgroundColor: 'rgba(34, 197, 94, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.5)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  completeEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  completeTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  completeSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
  },
  punchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 32,
  },
  punchCell: {
    width: (screenWidth - 80) / 5 - 8,
    aspectRatio: 1,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  punchCellFilled: {
    backgroundColor: 'white',
    borderColor: 'white',
  },
  punchCellEmpty: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  punchCellText: {
    fontWeight: 'bold',
  },
  punchCellTextFilled: {
    color: '#374151',
  },
  punchCellTextEmpty: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  detailButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  detailButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddCard;