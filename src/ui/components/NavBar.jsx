import React, { useState } from 'react'

const NavBar = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false);
    
    // Toggle dropdown visibility
    const toggleDropdown = () => {
        setIsDropdownOpen(!isDropdownOpen);
    };
    
    // Toggle mobile dropdown visibility
    const toggleMobileDropdown = (e) => {
        e.stopPropagation();
        setIsMobileDropdownOpen(!isMobileDropdownOpen);
    };
    
    // Toggle mobile menu
    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
        // Close dropdowns when toggling menu
        setIsMobileDropdownOpen(false);
    };
    
    // Close dropdown when clicking outside
    const closeDropdown = (e) => {
        if (!e.target.closest('.dropdown-container')) {
            setIsDropdownOpen(false);
        }
    };
    
    // Add event listener for clicks outside dropdown
    React.useEffect(() => {
        if (isDropdownOpen) {
            document.addEventListener('click', closeDropdown);
        }
        return () => {
            document.removeEventListener('click', closeDropdown);
        };
    }, [isDropdownOpen]);
    
    return (
        <>
            <div className="transition-colors duration-300">
                <div className='flex flex-col lg:flex-row justify-between items-center w-[95vw] lg:w-[90vw] xl:w-[80vw] mx-auto my-4 gap-4 lg:gap-0'>
                    <div className="bg-[url('/dispatchLight.png')] dark:bg-[url('/dispatchDark.png')] bg-no-repeat bg-contain h-10 w-64 md:w-72 lg:w-96"></div>
                    
                    {/* Desktop Contact Info (Large Screens) */}
                    <div className='hidden lg:flex items-center gap-4 xl:gap-10'>
                        <div className='flex gap-2'>
                            <a href="https://wa.me/+923700079545" className='bg-accent-400 w-10 h-10 rounded-full flex items-center justify-center'>
                                <img src="/whatsapp.svg" alt="Social Icon 1" className="invert w-6 h-6" />
                            </a>
                            <a href="https://www.facebook.com/www.dispatch.pk" className='bg-accent-400 w-10 h-10 rounded-full flex items-center justify-center'>
                                <img src="/facebook.svg" alt="Social Icon 2" className="invert w-6 h-6" />
                            </a>
                            <a href="https://www.youtube.com/@dispatchpk" className='bg-accent-400 w-10 h-10 rounded-full flex items-center justify-center'>
                                <img src="/youtube.svg" alt="Social Icon 3" className="invert w-6 h-6" />
                            </a>
                        </div>
                        <div className="flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <div>
                                <h4 className='text-accent-400 font-bold text-lg'>Call Us</h4>
                                <a href="https://wa.me/+923700079545" className="text-gray-700 dark:text-gray-300 hover:text-accent-400 dark:hover:text-accent-300 transition-colors">+92 370 0079545</a>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            <div>
                                <h4 className='text-accent-400 font-bold text-lg'>Email Us</h4>
                                <a href="mailto:contact@dispatch.pk" className="text-gray-700 dark:text-gray-300 hover:text-accent-400 dark:hover:text-accent-300 transition-colors">contact@dispatch.pk</a>
                            </div>
                        </div>
                    </div>
                    
                    {/* Mobile & Tablet Social & Contact Info */}
                    <div className="lg:hidden flex items-center gap-3">
                        <div className='flex gap-2'>
                            <a href="https://dispatch.pk" className='bg-accent-400 w-8 h-8 rounded-full flex items-center justify-center'>
                                <img src="/whatsapp.svg" alt="Social Icon 1" className="invert w-4 h-4" />
                            </a>
                            <a href="https://wa.me/+923700079545" className='bg-accent-400 w-8 h-8 rounded-full flex items-center justify-center'>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </a>
                            <a href="mailto:contact@dispatch.pk" className='bg-accent-400 w-8 h-8 rounded-full flex items-center justify-center'>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 transition-colors duration-300"></div>
            </div>
            
            {/* Main Navigation */}
            <div className="bg-green-500 dark:bg-green-600 py-4 shadow-sm transition-colors duration-300">
                <div className="w-[95vw] lg:w-[90vw] xl:w-[80vw] mx-auto">
                    {/* Desktop Navigation (Large Screens Only) */}
                    <div className="hidden lg:flex justify-between items-center">
                        <div className="flex items-center space-x-6">
                            <a href="https://dispatch.pk/" className="text-white hover:text-green-100 font-medium transition-colors">Home</a>
                            <a href="https://dispatch.pk/course-apply/" className="text-white hover:text-green-100 font-medium transition-colors">Course</a>
                            <a href="https://dispatch.pk/how-to-apply/" className="text-white hover:text-green-100 font-medium transition-colors">How to Apply</a>
                            <a href="https://dispatch.pk/blog/" className="text-white hover:text-green-100 font-medium transition-colors">Blog</a>
                            <a href="https://dispatch.pk/about-us/" className="text-white hover:text-green-100 font-medium transition-colors">About Us</a>
                            <div className="relative inline-block dropdown-container">
                                <div className="cursor-pointer">
                                    <div 
                                        className="flex items-center text-white hover:text-green-100 font-medium transition-colors"
                                        onClick={toggleDropdown}
                                    >
                                        <span>Information</span>
                                        <svg className="fill-current h-4 w-4 ml-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                        </svg>
                                    </div>
                                    {isDropdownOpen && (
                                        <div className="absolute bg-green-600 dark:bg-green-700 mt-1 py-1 rounded shadow-lg z-10 min-w-[200px]">
                                            <a href="https://dispatch.pk/frequently-asked-questions/" className="block px-4 py-2 text-white hover:bg-green-700 dark:hover:bg-green-800">Frequently Asked Question</a>
                                            <a href="https://dispatch.pk/contact-us/" className="block px-4 py-2 text-white hover:bg-green-700 dark:hover:bg-green-800">Contact Us</a>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <a href="https://dispatch.pk/start-earning/" className="text-white hover:text-green-100 font-medium transition-colors">Start Earning</a>
                        </div>
                        <div className='flex gap-4'>
                            <a href="https://dispatch.pk/signup" className="bg-white hover:bg-green-50 text-green-600 dark:text-green-700 px-4 py-2 rounded-md font-medium transition-colors flex items-center">
                                Apply Now
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </a>
                            <a href="https://dispatch.pk/login" className="bg-green-700 dark:bg-green-800 hover:bg-green-800 dark:hover:bg-green-900 text-white px-4 py-2 rounded-md font-medium transition-colors flex items-center">
                                Login LMS
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                    
                    {/* Mobile & Tablet Navigation */}
                    <div className="flex lg:hidden justify-between items-center">
                        <button 
                            onClick={toggleMobileMenu}
                            className="text-white p-2 focus:outline-none"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
                            </svg>
                        </button>
                        <div className='flex gap-2'>
                            <a href="https://dispatch.pk/signup" className="bg-white hover:bg-green-50 text-green-600 dark:text-green-700 px-3 py-1.5 text-sm md:text-base md:px-4 md:py-2 rounded-md font-medium transition-colors flex items-center">
                                Apply Now
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 md:h-5 md:w-5 md:ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </a>
                            <a href="https://dispatch.pk/login" className="bg-green-700 dark:bg-green-800 hover:bg-green-800 dark:hover:bg-green-900 text-white px-3 py-1.5 text-sm md:text-base md:px-4 md:py-2 rounded-md font-medium transition-colors flex items-center">
                                Login LMS
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1 md:h-5 md:w-5 md:ml-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                    
                    {/* Mobile & Tablet Menu */}
                    {isMobileMenuOpen && (
                        <div className="mt-4 lg:hidden bg-green-600 dark:bg-green-700 rounded-md px-4 py-3 shadow-lg">
                            <div className="flex flex-col space-y-3">
                                <a href="https://dispatch.pk/" className="text-white hover:text-green-100 font-medium transition-colors py-1">Home</a>
                                <a href="https://dispatch.pk/course-apply/" className="text-white hover:text-green-100 font-medium transition-colors py-1">Course</a>
                                <a href="https://dispatch.pk/how-to-apply/" className="text-white hover:text-green-100 font-medium transition-colors py-1">How to Apply</a>
                                <a href="https://dispatch.pk/blog/" className="text-white hover:text-green-100 font-medium transition-colors py-1">Blog</a>
                                <a href="https://dispatch.pk/about-us/" className="text-white hover:text-green-100 font-medium transition-colors py-1">About Us</a>
                                
                                {/* Separate mobile dropdown with its own state */}
                                <div className="py-1">
                                    <div 
                                        className="flex items-center text-white hover:text-green-100 font-medium transition-colors cursor-pointer"
                                        onClick={toggleMobileDropdown}
                                    >
                                        <span>Information</span>
                                        <svg 
                                            className={`fill-current h-4 w-4 ml-1 transform transition-transform duration-200 ${isMobileDropdownOpen ? 'rotate-180' : ''}`} 
                                            xmlns="http://www.w3.org/2000/svg" 
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                        </svg>
                                    </div>
                                    {isMobileDropdownOpen && (
                                        <div className="pl-4 mt-2 space-y-2 border-l-2 border-green-500 dark:border-green-400 ml-1">
                                            <a href="https://dispatch.pk/frequently-asked-questions/" className="block text-white hover:text-green-100 py-1">Frequently Asked Question</a>
                                            <a href="https://dispatch.pk/contact-us/" className="block text-white hover:text-green-100 py-1">Contact Us</a>
                                        </div>
                                    )}
                                </div>
                                <a href="https://dispatch.pk/start-earning/" className="text-white hover:text-green-100 font-medium transition-colors py-1">Start Earning</a>
                                
                                {/* Mobile Contact Info */}
                                <div className="border-t border-green-500 dark:border-green-500 pt-3 mt-2">
                                    <div className="text-white text-sm py-1 md:text-base">
                                        <div className="flex items-center">
                                            <span className="font-medium">Call:</span>
                                            <a href="https://wa.me/+923700079545" className="ml-2 hover:text-green-100">+92 370 0079545</a>
                                        </div>
                                    </div>
                                    <div className="text-white text-sm py-1 md:text-base">
                                        <div className="flex items-center">
                                            <span className="font-medium">Email:</span>
                                            <a href="mailto:contact@dispatch.pk" className="ml-2 hover:text-green-100">contact@dispatch.pk</a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    )
}

export default NavBar
