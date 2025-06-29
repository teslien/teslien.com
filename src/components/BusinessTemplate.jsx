import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Billing, 
  Business, 
  CardDeal, 
  Clients, 
  CTA, 
  Footer, 
  Hero, 
  Navbar, 
  Stats, 
  Testimonials 
} from './index'
import styles from '../style'

const BusinessTemplate = () => {
  return (
    <div className='bg-primary w-full overflow-hidden'>
      {/* Enhanced Navbar with Blog Link */}
      <div className={`${styles.paddingX} ${styles.flexCenter}`}>
        <div className={`${styles.boxWidth}`}>
          <div className="flex justify-between items-center py-6">
            <Navbar/>
            <Link 
              to="/blog" 
              className="bg-blue-gradient py-3 px-6 font-poppins font-medium text-[16px] text-primary outline-none rounded-[10px] hover:scale-105 transition-transform"
            >
              Visit Blog
            </Link>
          </div>
        </div>
      </div>
      
      {/* Hero Section */}
      <div className={`bg-primary ${styles.flexStart}`}>
        <div className={`${styles.boxWidth}`}>
          <Hero/>      
        </div>
      </div>
      
      {/* Main Content */}
      <div className={`bg-primary ${styles.paddingX} ${styles.flexStart}`}>
        <div className={`${styles.boxWidth}`}>
          <Stats/>
          <Business/>
          <Billing/>
          <CardDeal/>
          <Testimonials/>
          <Clients/>
          
          {/* Enhanced CTA with Blog Preview */}
          <div className="bg-black-gradient-2 rounded-[20px] box-shadow mb-12 p-8">
            <div className="flex flex-col lg:flex-row justify-between items-center">
              <div className="flex-1">
                <CTA/>
              </div>
              <div className="flex-1 lg:ml-8 mt-8 lg:mt-0">
                <div className="text-center lg:text-left">
                  <h3 className="font-poppins font-semibold text-white text-[24px] leading-[32px] mb-4">
                    Stay Updated
                  </h3>
                  <p className="font-poppins font-normal text-dimWhite text-[16px] leading-[24px] mb-6">
                    Explore our latest insights, tips, and industry trends on our blog.
                  </p>
                  <Link 
                    to="/blog"
                    className="py-4 px-8 bg-blue-gradient font-poppins font-medium text-[16px] text-primary outline-none rounded-[10px] hover:scale-105 transition-transform inline-block"
                  >
                    Read Our Blog
                  </Link>
                </div>
              </div>
            </div>
          </div>
          
          <Footer/>     
        </div>
      </div>
    </div>
  )
}

export default BusinessTemplate 