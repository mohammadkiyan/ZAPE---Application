import { cn } from '@/lib/utils';
import {
  detectWritingDirection,
  directionForLocale,
  type WritingDirection,
} from '@/localization/locale';
import { usePreferences } from '@/preferences/preferences';
import { fontFamilyForClass } from '@/theme/fonts';
import { Slot } from '@rn-primitives/slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Platform, Text as RNText, type Role } from 'react-native';

const textVariants = cva(
  cn(
    'font-sans text-foreground text-base',
    Platform.select({
      web: 'select-text',
    })
  ),
  {
    variants: {
      variant: {
        default: '',
        h1: cn(
          'text-center text-4xl font-extrabold tracking-tight',
          Platform.select({ web: 'scroll-m-20 text-balance' })
        ),
        h2: cn(
          'border-border border-b pb-2 text-3xl font-semibold tracking-tight',
          Platform.select({ web: 'scroll-m-20 first:mt-0' })
        ),
        h3: cn('text-2xl font-semibold tracking-tight', Platform.select({ web: 'scroll-m-20' })),
        h4: cn('text-xl font-semibold tracking-tight', Platform.select({ web: 'scroll-m-20' })),
        p: 'mt-3 leading-7 sm:mt-6',
        blockquote: 'mt-4 border-l-2 pl-3 italic sm:mt-6 sm:pl-6',
        code: cn(
          'bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold'
        ),
        lead: 'text-muted-foreground text-xl',
        large: 'text-lg font-semibold',
        small: 'text-sm font-medium leading-none',
        muted: 'text-muted-foreground text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

type TextVariantProps = VariantProps<typeof textVariants>;

type TextVariant = NonNullable<TextVariantProps['variant']>;

const ROLE: Partial<Record<TextVariant, Role>> = {
  h1: 'heading',
  h2: 'heading',
  h3: 'heading',
  h4: 'heading',
  blockquote: Platform.select({ web: 'blockquote' as Role }),
  code: Platform.select({ web: 'code' as Role }),
};

const ARIA_LEVEL: Partial<Record<TextVariant, string>> = {
  h1: '1',
  h2: '2',
  h3: '3',
  h4: '4',
};

const TextClassContext = React.createContext<string | undefined>(undefined);

// Nested Text renders as a span of its parent's paragraph, so only the outermost Text
// owns the paragraph's width and direction.
const InsideTextContext = React.createContext(false);

function textContent(node: React.ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textContent).join('');
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    return textContent(node.props.children);
  }
  return '';
}

// The paragraph follows its script's direction so `textAlign: 'auto'` lands on the side
// the text reads from. iOS reads `writingDirection`; Android ignores it and takes the
// paragraph direction from the Yoga `direction` instead.
function directionStyleFor(direction: WritingDirection) {
  return { direction, writingDirection: direction } as const;
}

function Text({
  className,
  asChild = false,
  variant = 'default',
  style,
  ...props
}: React.ComponentProps<typeof RNText> &
  React.RefAttributes<typeof RNText> &
  TextVariantProps & {
    asChild?: boolean;
  }) {
  const textClass = React.useContext(TextClassContext);
  const nested = React.useContext(InsideTextContext);
  const locale = usePreferences((state) => state.locale);
  const Component = asChild ? Slot : RNText;
  const directionStyle = nested
    ? undefined
    : directionStyleFor(
        detectWritingDirection(textContent(props.children)) ?? directionForLocale(locale)
      );
  const classes = cn(
    !nested && 'w-full',
    textVariants({ variant }),
    {
      'pt-2': directionStyle?.direction === 'rtl',
    },
    textClass,
    className
  );
  // Bundled fonts register one family per weight, so the family carries the weight.
  const fontStyle = {
    fontFamily: fontFamilyForClass(classes, locale),
    fontWeight: 'normal' as const,
  };
  return (
    <InsideTextContext.Provider value={true}>
      <Component
        className={classes}
        style={[fontStyle, directionStyle, style]}
        role={variant ? ROLE[variant] : undefined}
        aria-level={variant ? ARIA_LEVEL[variant] : undefined}
        {...props}
      />
    </InsideTextContext.Provider>
  );
}

export { Text, TextClassContext };
