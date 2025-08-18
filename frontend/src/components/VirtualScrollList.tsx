import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from "react";

export interface VirtualScrollItem {
  id: string | number;
  height?: number;
}

export interface VirtualScrollListProps<T extends VirtualScrollItem> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  loading?: boolean;
  loadingComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
}

export function VirtualScrollList<T extends VirtualScrollItem>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = "",
  onScroll,
  loading = false,
  loadingComponent,
  emptyComponent,
}: VirtualScrollListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollElementRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    return {
      start: Math.max(0, startIndex - overscan),
      end: Math.min(items.length - 1, endIndex + overscan),
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Calculate total height
  const totalHeight = items.length * itemHeight;

  // Calculate offset for visible items
  const offsetY = visibleRange.start * itemHeight;

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.start, visibleRange.end + 1);
  }, [items, visibleRange.start, visibleRange.end]);

  // Handle scroll
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const newScrollTop = e.currentTarget.scrollTop;
      setScrollTop(newScrollTop);
      onScroll?.(newScrollTop);
    },
    [onScroll]
  );

  // Scroll to item
  const scrollToItem = useCallback(
    (index: number, align: "start" | "center" | "end" = "start") => {
      if (!scrollElementRef.current) return;

      let scrollTop: number;
      const itemTop = index * itemHeight;

      switch (align) {
        case "start":
          scrollTop = itemTop;
          break;
        case "center":
          scrollTop = itemTop - containerHeight / 2 + itemHeight / 2;
          break;
        case "end":
          scrollTop = itemTop - containerHeight + itemHeight;
          break;
      }

      scrollElementRef.current.scrollTop = Math.max(
        0,
        Math.min(scrollTop, totalHeight - containerHeight)
      );
    },
    [itemHeight, containerHeight, totalHeight]
  );

  // Expose scroll methods
  useEffect(() => {
    const element = scrollElementRef.current;
    if (element) {
      (element as any).scrollToItem = scrollToItem;
    }
  }, [scrollToItem]);

  if (loading && loadingComponent) {
    return <div className={className}>{loadingComponent}</div>;
  }

  if (items.length === 0 && emptyComponent) {
    return <div className={className}>{emptyComponent}</div>;
  }

  return (
    <div
      ref={scrollElementRef}
      className={`virtual-scroll-container ${className}`}
      style={{
        height: containerHeight,
        overflow: "auto",
        position: "relative",
      }}
      onScroll={handleScroll}
    >
      {/* Total height spacer */}
      <div style={{ height: totalHeight, position: "relative" }}>
        {/* Visible items container */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={item.id}
              style={{
                height: item.height || itemHeight,
                position: "relative",
              }}
            >
              {renderItem(item, visibleRange.start + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for virtual scrolling with dynamic item heights
 */
export function useVirtualScroll<T extends VirtualScrollItem>(
  items: T[],
  estimatedItemHeight: number = 50
) {
  const [itemHeights, setItemHeights] = useState<Map<string | number, number>>(
    new Map()
  );
  const [scrollTop, setScrollTop] = useState(0);

  const measureItem = useCallback((id: string | number, height: number) => {
    setItemHeights((prev) => {
      const newMap = new Map(prev);
      newMap.set(id, height);
      return newMap;
    });
  }, []);

  const getItemHeight = useCallback(
    (id: string | number) => {
      return itemHeights.get(id) || estimatedItemHeight;
    },
    [itemHeights, estimatedItemHeight]
  );

  const getTotalHeight = useCallback(() => {
    return items.reduce((total, item) => {
      return total + getItemHeight(item.id);
    }, 0);
  }, [items, getItemHeight]);

  const getVisibleRange = useCallback(
    (containerHeight: number, overscan: number = 5) => {
      let accumulatedHeight = 0;
      let startIndex = 0;
      let endIndex = 0;

      // Find start index
      for (let i = 0; i < items.length; i++) {
        const itemHeight = getItemHeight(items[i].id);
        if (accumulatedHeight + itemHeight > scrollTop) {
          startIndex = Math.max(0, i - overscan);
          break;
        }
        accumulatedHeight += itemHeight;
      }

      // Find end index
      accumulatedHeight = 0;
      for (let i = 0; i < items.length; i++) {
        const itemHeight = getItemHeight(items[i].id);
        accumulatedHeight += itemHeight;
        if (accumulatedHeight > scrollTop + containerHeight) {
          endIndex = Math.min(items.length - 1, i + overscan);
          break;
        }
      }

      return { start: startIndex, end: endIndex };
    },
    [items, getItemHeight, scrollTop]
  );

  const getOffsetForIndex = useCallback(
    (index: number) => {
      let offset = 0;
      for (let i = 0; i < index && i < items.length; i++) {
        offset += getItemHeight(items[i].id);
      }
      return offset;
    },
    [items, getItemHeight]
  );

  return {
    scrollTop,
    setScrollTop,
    measureItem,
    getItemHeight,
    getTotalHeight,
    getVisibleRange,
    getOffsetForIndex,
  };
}

/**
 * Item measurement component for dynamic heights
 */
export interface MeasuredItemProps {
  id: string | number;
  onMeasure: (id: string | number, height: number) => void;
  children: React.ReactNode;
}

export function MeasuredItem({ id, onMeasure, children }: MeasuredItemProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          onMeasure(id, entry.contentRect.height);
        }
      });

      resizeObserver.observe(ref.current);

      return () => {
        resizeObserver.disconnect();
      };
    }
  }, [id, onMeasure]);

  return <div ref={ref}>{children}</div>;
}
