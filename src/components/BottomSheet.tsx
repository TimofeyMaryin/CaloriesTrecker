import React, { useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetView,
  BottomSheetScrollView,
} from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
  /** Sheet background color (default: colors.white) */
  backgroundColor?: string;
  /** Snap points e.g. ['40%'] — when set, sheet uses fixed height instead of dynamic sizing */
  snapPoints?: (string | number)[];
  /** Enable scrollable content inside the sheet */
  scrollable?: boolean;
}

const BottomSheet: React.FC<BottomSheetProps> = ({
  visible,
  onClose,
  title,
  children,
  backgroundColor = colors.white,
  snapPoints: snapPointsProp,
  scrollable = false,
}) => {
  const ref = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const useFixedHeight = Boolean(snapPointsProp?.length);

  useEffect(() => {
    if (visible) {
      ref.current?.present();
    } else {
      ref.current?.dismiss();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.4}
      />
    ),
    [],
  );

  const contentStyle = [
    styles.content,
    {
      paddingBottom: useFixedHeight
        ? insets.bottom + 56
        : insets.bottom + 20,
    },
  ];

  const ContentWrapper = scrollable ? BottomSheetScrollView : BottomSheetView;

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing={!useFixedHeight}
      snapPoints={useFixedHeight ? snapPointsProp : undefined}
      index={useFixedHeight ? 0 : undefined}
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={styles.handle}
      backgroundStyle={[styles.background, { backgroundColor }]}
    >
      <ContentWrapper
        style={contentStyle}
        showsVerticalScrollIndicator={false}
      >
        {title && (
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        {children ?? <Text style={styles.placeholder}>Placeholder</Text>}
      </ContentWrapper>
    </BottomSheetModal>
  );
};

const styles = StyleSheet.create({
  handle: {
    width: 40,
    backgroundColor: '#DCDEDB',
  },
  background: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeIcon: {
    fontSize: 20,
    color: colors.text,
    fontWeight: '300',
  },
  placeholder: {
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default BottomSheet;
