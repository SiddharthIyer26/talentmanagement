import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFLinkAnnotation {
  href: string;
  left_mm: number;
  top_mm: number;
  width_mm: number;
  height_mm: number;
}

export class PDFService {
  /**
   * Captures a DOM element by ID and converts it to a multi-page or single-page PDF document
   * with active clickable hyperlinks and razor-sharp 300 DPI resolution.
   */
  public async generatePDFFromElement(elementId: string, filename: string) {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element #${elementId} not found for PDF generation.`);
      return;
    }

    try {
      // 1. Await font loading & pre-render image loading prior to DOM capture
      try {
        if (document.fonts) {
          await document.fonts.ready;
        }
      } catch (e) {
        console.warn('document.fonts.ready not supported or failed', e);
      }

      const imgNodes = Array.from(element.querySelectorAll('img'));
      await Promise.all(
        imgNodes.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );

      // Brief layout stabilization delay to allow DOM & theme re-render
      await new Promise(r => setTimeout(r, 200));

      const containerStyle = window.getComputedStyle(element);
      const activeBg = containerStyle.backgroundColor || '#0b0f17';
      const activeFont = containerStyle.fontFamily || 'Inter, system-ui, sans-serif';

      // Extract link coordinates prior to canvas capture
      const containerRect = element.getBoundingClientRect();
      const pdfTotalHeight_mm = Math.max(297, (containerRect.height * 210) / containerRect.width);

      const linkNodes = Array.from(element.querySelectorAll('a[href], [data-pdf-link]'));
      const links: PDFLinkAnnotation[] = linkNodes
        .map(node => {
          const rect = node.getBoundingClientRect();
          const href = node.getAttribute('href') || node.getAttribute('data-pdf-link') || '';
          if (!href || href === '#' || href.startsWith('javascript:')) return null;

          return {
            href,
            left_mm: ((rect.left - containerRect.left) / containerRect.width) * 210,
            top_mm: ((rect.top - containerRect.top) / containerRect.height) * pdfTotalHeight_mm,
            width_mm: (rect.width / containerRect.width) * 210,
            height_mm: (rect.height / containerRect.height) * pdfTotalHeight_mm
          };
        })
        .filter((l): l is PDFLinkAnnotation => l !== null);

      // 2. Capture element at 3x scale (300 DPI quality) with theme style locking
      const canvas = await html2canvas(element, {
        scale: 3, // High-definition resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: activeBg,
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: element.scrollWidth || 794,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById(elementId);
          if (el) {
            el.style.width = '794px';
            el.style.maxWidth = '794px';
            el.style.minWidth = '794px';
            el.style.height = '1123px';
            el.style.maxHeight = '1123px';
            el.style.letterSpacing = 'normal';
            el.style.boxSizing = 'border-box';
            el.style.transform = 'none';
            el.style.overflow = 'hidden';
            el.style.fontFamily = activeFont;
            el.style.backgroundColor = activeBg;

            const allElements = el.querySelectorAll('*');
            allElements.forEach((node) => {
              const htmlNode = node as HTMLElement;
              htmlNode.style.letterSpacing = 'normal';
              htmlNode.style.wordSpacing = 'normal';
              htmlNode.style.textRendering = 'geometricPrecision';
              htmlNode.style.boxSizing = 'border-box';
            });

            // Prevent avatar or images from expanding uncontrollably in canvas clone
            const imgNodes = el.querySelectorAll('img');
            imgNodes.forEach(img => {
              const isCover = img.classList && typeof img.classList.contains === 'function' && img.classList.contains('object-cover');
              const isRounded = typeof img.className === 'string' && img.className.includes('rounded-');
              if (isCover || isRounded) {
                img.style.maxWidth = '80px';
                img.style.maxHeight = '80px';
                img.style.objectFit = 'cover';
              }
            });
          }
        }
      });

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // 3. Render PDF pages & inject interactive link annotations
      const isSinglePageDoc = elementId === 'media-kit-preview-container' || elementId.startsWith('invoice-preview') || imgHeight <= 310;

      if (isSinglePageDoc) {
        // Single-page A4 document
        pdf.addImage(imgData, 'PNG', 0, 0, 210, 297, undefined, 'FAST');

        // Inject clickable hyperlink annotations
        links.forEach(l => {
          pdf.link(l.left_mm, l.top_mm, l.width_mm, l.height_mm, { url: l.href });
        });
      } else {
        // Multi-page A4 document
        const totalPages = Math.ceil(imgHeight / pageHeight);

        for (let p = 0; p < totalPages; p++) {
          if (p > 0) {
            pdf.addPage();
          }
          pdf.setPage(p + 1);

          const position = -(p * pageHeight);
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');

          // Add links belonging to page p
          const pageMinY = p * pageHeight;
          const pageMaxY = (p + 1) * pageHeight;

          links.forEach(l => {
            if (l.top_mm >= pageMinY && l.top_mm < pageMaxY) {
              const pageRelY = l.top_mm - pageMinY;
              pdf.link(l.left_mm, pageRelY, l.width_mm, l.height_mm, { url: l.href });
            }
          });
        }
      }

      pdf.save(filename);
    } catch (err) {
      console.error('PDF Generation failed:', err);
      window.print();
    }
  }

  /**
   * Generates formatted invoice PDF
   */
  public async exportInvoice(invoiceId: string) {
    await this.generatePDFFromElement(`invoice-preview-${invoiceId}`, `Invoice_${invoiceId}.pdf`);
  }

  /**
   * Generates formatted media kit PDF
   */
  public async exportMediaKit(influencerName: string, theme: string) {
    const safeName = influencerName.replace(/[^a-zA-Z0-9]/g, '_');
    await this.generatePDFFromElement('media-kit-preview-container', `MediaKit_${safeName}_${theme}.pdf`);
  }
}

export const pdfService = new PDFService();
