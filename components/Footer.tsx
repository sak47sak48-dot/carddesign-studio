export default function Footer() {
    return (
      <footer className="mt-16 border-t border-[#EDE7DF] bg-white">
        <div className="mx-auto grid max-w-[1440px] gap-8 px-5 py-12 md:grid-cols-2 md:px-8 lg:grid-cols-4 lg:px-16">
  
          {/* BRAND */}
          <div>
  
            <h3 className="text-2xl font-bold text-[#8B2E3F]">
              carddesign.studio
            </h3>
  
            <p className="mt-4 text-sm leading-6 text-[#756B67]">
              Premium wedding invitations for
              Muslim, Hindu and Christian
              celebrations.
            </p>
  
          </div>
  
          {/* SHOP */}
          <div>
  
            <h4 className="font-semibold">
              Shop
            </h4>
  
            <div className="mt-4 flex flex-col gap-2 text-sm text-[#756B67]">
  
              <a
                href="/products"
                className="transition hover:text-[#8B2E3F]"
              >
                All Cards
              </a>
  
              <a
                href="/products?category=Muslim"
                className="transition hover:text-[#8B2E3F]"
              >
                Muslim Cards
              </a>
  
              <a
                href="/products?category=Hindu"
                className="transition hover:text-[#8B2E3F]"
              >
                Hindu Cards
              </a>
  
              <a
                href="/products?category=Christian"
                className="transition hover:text-[#8B2E3F]"
              >
                Christian Cards
              </a>
  
            </div>
  
          </div>
  
          {/* ACCOUNT */}
          <div>
  
            <h4 className="font-semibold">
              Account
            </h4>
  
            <div className="mt-4 flex flex-col gap-2 text-sm text-[#756B67]">
  
              <a
                href="/wishlist"
                className="transition hover:text-[#8B2E3F]"
              >
                Wishlist
              </a>
  
              <a
                href="/cart"
                className="transition hover:text-[#8B2E3F]"
              >
                Cart
              </a>
  
              <a
                href="/track-order"
                className="transition hover:text-[#8B2E3F]"
              >
                Track Order
              </a>
  
              <a
                href="/profile"
                className="transition hover:text-[#8B2E3F]"
              >
                Profile
              </a>
  
            </div>
  
          </div>
  
          {/* SUPPORT */}
          <div>
  
            <h4 className="font-semibold">
              Support
            </h4>
  
            <div className="mt-4 flex flex-col gap-2 text-sm text-[#756B67]">
  
              <p>
                Bengaluru, India
              </p>
  
              <a
                href="/whatsapp-support"
                className="transition hover:text-[#8B2E3F]"
              >
                WhatsApp Support
              </a>
  
              <a
                href="mailto:support@wedinvite.in"
                className="transition hover:text-[#8B2E3F]"
              >
                support@wedinvite.in
              </a>
  
            </div>
  
          </div>
  
        </div>
  
        {/* BOTTOM */}
        <div className="border-t border-[#EDE7DF]">
  
          <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-5 py-5 text-xs text-[#817672] md:flex-row md:items-center md:justify-between md:px-8 lg:px-16">
  
            <p>
              © 2026 carddesign.studio. All rights reserved.
            </p>
  
            <div className="flex flex-wrap gap-4">
  
              <a
                href="/products"
                className="transition hover:text-[#8B2E3F]"
              >
                Wedding Cards
              </a>
  
              <a
                href="/track-order"
                className="transition hover:text-[#8B2E3F]"
              >
                Track Order
              </a>
  
              <a
                href="/whatsapp-support"
                className="transition hover:text-[#8B2E3F]"
              >
                Support
              </a>
  
            </div>
  
          </div>
  
        </div>
  
      </footer>
    );
  }