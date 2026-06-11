const fs = require('fs');

const files = [
  'src/modules/products/products-home.tsx',
  'src/modules/products/products-list.tsx',
  'src/modules/products/product-editor.tsx',
  'src/modules/products/product-form.tsx',
  'src/modules/products/product-media-gallery.tsx',
  'src/modules/products/product-status-panel.tsx',
  'src/modules/products/product-preview-sheet.tsx',
  'src/modules/products/bulk-pricing-editor.tsx',
  'src/modules/variants/variants-home.tsx',
  'src/modules/variants/variant-table.tsx',
  'src/modules/variants/variant-matrix-panel.tsx',
  'src/modules/variants/variant-bulk-bar.tsx',
  'src/modules/variants/variant-image-selector.tsx',
  'src/modules/variants/variant-preview-sheet.tsx',
];

for (const f of files) {
  console.log('\n=== ' + f + ' ===');
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const matches = line.match(/'([^']+)'/g);
    if (matches) {
      for (const m of matches) {
        const val = m.slice(1, -1);
        if (val.length >= 2 && !val.includes('\n') && !val.startsWith('http') && !val.startsWith('/') &&
            !val.startsWith('@') && !val.startsWith('./') && !val.startsWith('../') &&
            !val.startsWith('bg-') && !val.startsWith('text-') && !val.startsWith('flex') &&
            !val.startsWith('grid') && !val.startsWith('size-') && !val.startsWith('h-') &&
            !val.startsWith('w-') && !val.startsWith('min-') && !val.startsWith('max-') &&
            !val.startsWith('border-') && !val.startsWith('rounded-') && !val.startsWith('p-') &&
            !val.startsWith('px-') && !val.startsWith('py-') && !val.startsWith('gap-') &&
            !val.startsWith('sticky') && !val.startsWith('hidden') && !val.startsWith('inline-') &&
            !val.startsWith('aspect-') && !val.startsWith('cursor-') && !val.startsWith('overflow-') &&
            !val.startsWith('opacity-') && !val.startsWith('shadow-') && !val.startsWith('glass-') &&
            !val.startsWith('animate-') && !val.startsWith('tabular-') && !val.startsWith('tracking-') &&
            !val.startsWith('leading-') && !val.startsWith('line-') && !val.startsWith('whitespace-') &&
            !val.startsWith('capitalize') && !val.startsWith('sr-only') && !val.startsWith('accent-') &&
            !val.startsWith('shrink-') && !val.startsWith('truncate') && !val.startsWith('relative') &&
            !val.startsWith('absolute') && !val.startsWith('fixed') && !val.startsWith('block') &&
            !val.startsWith('object-') && !val.startsWith('font-') && !val.startsWith('hover:') &&
            !val.startsWith('focus:') && !val.startsWith('disabled:') && !val.startsWith('data-') &&
            !val.startsWith('aria-') && !val.startsWith('role=') && !val.startsWith('tabIndex=') &&
            !val.startsWith('id=') && !val.startsWith('type=') && !val.startsWith('accept=') &&
            !val.startsWith('variant=') && !val.startsWith('size=') && !val.startsWith('className=') &&
            !val.startsWith('label=') && !val.startsWith('placeholder=') && !val.startsWith('step=') &&
            !val.startsWith('min=') && !val.startsWith('value=') && !val.startsWith('onChange=') &&
            !val.startsWith('onClick=') && !val.startsWith('onBlur=') && !val.startsWith('onKeyDown=') &&
            !val.startsWith('onDrag') && !val.startsWith('ref=') && !val.startsWith('name=') &&
            !val.startsWith('htmlFor=') && !val.startsWith('key=') && !val.startsWith('href=') &&
            !val.startsWith('src=') && !val.startsWith('alt=') && !val.startsWith('title=') &&
            !val.startsWith('disabled=') && !val.startsWith('checked=') && !val.startsWith('draggable=') &&
            !val.startsWith('side=') && !val.startsWith('colSpan=') && !val.startsWith('style=') &&
            !val.startsWith(' dangerously') &&
            val !== 'use client' && val !== 'react' && val !== 'next/link' && val !== 'next/navigation' &&
            val !== 'lucide-react' && val !== '@hookform/resolvers/zod' &&
            val !== 'react-hook-form' && val !== 'zod' && val !== 'new' && val !== '2-digit' &&
            val !== 'image/' && val !== 'copy' && val !== 'move' && val !== 'file' && val !== 'button' &&
            val !== 'checkbox' && val !== 'number' && val !== 'text' && val !== 'right' && val !== 'status' &&
            val !== 'kind' && val !== 'variant' && val !== 'color' && val !== 'size' && val !== 'type' &&
            val !== 'custom' && val !== 'published' && val !== 'draft' && val !== 'pending_review' &&
            val !== 'secondary' && val !== 'scheduled' && val !== 'outline' && val !== 'hidden' &&
            val !== 'rejected' && val !== 'destructive' && val !== 'default' && val !== 'ghost' &&
            val !== 'onChange' && val !== 'media' && val !== 'name' && val !== 'seo.slug' &&
            val !== 'product-media-file-input' && val !== 'Enter' && val !== 'selected' &&
            val !== 'capitalize' && val !== 'string' && val !== 'variants have been created' &&
            val !== 'cannot define' && val !== 'productId' && val !== 'bulkPricing' && val !== 'moq' &&
            val !== 'description' && val !== 'relative' && val !== 'images' && val !== 'category' &&
            val !== 'variants' && val !== 'seo' && val !== 'e.' && val !== 'e' && val !== 'product-media' &&
            val !== 'img_' && val !== 'img' && val !== 'catalog/p/' && val !== 'catalog/p/' &&
            val !== 'blob:' && val !== 'text/plain' && val !== 'productId=' && val !== 'group relative' &&
            val !== 'icon-xs' && val !== '0ms' && val !== '120ms' && val !== '240ms' && val !== 'sm' &&
            val !== 'mt-3' && val !== 'pb-2' && val !== 'pb-3' && val !== 'pl-9' && val !== 'icon-sm' &&
            val !== 'mt-1.5' && val !== 'mt-2' && val !== 'mt-4' && val !== 'mt-6' && val !== 'space-y-4' &&
            val !== 'min-w-0' && val !== 'flex-1' && val !== 'h-8' && val !== 'w-28' && val !== 'max-w-xs' &&
            val !== 'h-9' && val !== 'max-w-[140px]' && val !== 'w-20' && val !== 'w-14' && val !== 'w-16' &&
            val !== 'w-10' && val !== 'min-w-[8rem]' && val !== 'pointer-events-none opacity-50' &&
            val !== 'archived' && val !== 'checkbox' && val !== 'product-media' && val !== 'text/plain' &&
            val !== 'group relative' && val !== 'sm:max-w-lg' && val !== 'sm:max-w-md' && val !== 'w-full gap-0' &&
            val !== 'border-border' && val !== 'border-border/80' && val !== 'border-border/60' &&
            val !== 'border-border/50' && val !== 'border-border/40' && val !== 'bg-card' &&
            val !== 'bg-muted/20' && val !== 'bg-muted/15' && val !== 'bg-muted/30' && val !== 'bg-muted/40' &&
            val !== 'bg-muted/50' && val !== 'bg-muted/60' && val !== 'bg-primary/5' && val !== 'bg-primary/10' &&
            val !== 'bg-primary/15' && val !== 'bg-card/50' && val !== 'bg-card/60' && val !== 'bg-background/50' &&
            val !== 'bg-background/40' && val !== 'text-muted-foreground' && val !== 'text-foreground' &&
            val !== 'text-primary' && val !== 'text-destructive' && val !== 'text-amber-600' &&
            val !== 'text-emerald-500' && val !== 'text-amber-500/70' && val !== 'text-[10px]' &&
            val !== 'text-[11px]' && val !== 'text-xs' && val !== 'text-sm' && val !== 'text-base' &&
            val !== 'text-lg' && val !== 'text-xl' && val !== 'font-medium' && val !== 'font-semibold' &&
            val !== 'font-normal' && val !== 'font-bold' && val !== 'uppercase' && val !== 'tracking-wide' &&
            val !== 'tracking-tight' && val !== 'leading-none' && val !== 'leading-tight' &&
            val !== 'line-clamp-4' && val !== 'line-clamp-3' && val !== 'truncate' && val !== 'whitespace-nowrap' &&
            val !== 'tabular-nums' && val !== 'rounded-lg' && val !== 'rounded-xl' && val !== 'rounded-2xl' &&
            val !== 'rounded-full' && val !== 'rounded-md' && val !== 'border' && val !== 'border-dashed' &&
            val !== 'border-t' && val !== 'shadow-sm' && val !== 'shadow-
