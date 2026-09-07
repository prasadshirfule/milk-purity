import { Request, Response } from 'express';
import { dataRepository } from '../services/seedService';
import { CustomerCodeService } from '../services/customerCodeService';

export const getFarmers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, animalType, status } = req.query;
    let farmers = await dataRepository.getFarmers();

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      farmers = farmers.filter(
        f =>
          f.name.toLowerCase().includes(q) ||
          f.farmerId.toLowerCase().includes(q) ||
          (f.customerCode && f.customerCode.toLowerCase().includes(q)) ||
          f.village.toLowerCase().includes(q)
      );
    }

    if (animalType && typeof animalType === 'string' && animalType !== 'ALL') {
      farmers = farmers.filter(f => f.animalType === animalType);
    }

    if (status && typeof status === 'string' && status !== 'ALL') {
      farmers = farmers.filter(f => f.status === status);
    }

    res.json({ success: true, count: farmers.length, data: farmers });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getFarmerById = async (req: Request, res: Response): Promise<void> => {
  try {
    const farmer = await dataRepository.getFarmerById(req.params.id);
    if (!farmer) {
      res.status(404).json({ success: false, error: 'Farmer not found' });
      return;
    }

    // Get farmer tests history
    const allTests = await dataRepository.getTests();
    const farmerTests = allTests.filter(t => t.farmerId === req.params.id);

    res.json({
      success: true,
      data: {
        ...farmer,
        tests: farmerTests
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getFarmerByCustomerCode = async (req: Request, res: Response): Promise<void> => {
  try {
    const rawCode = req.params.customerCode;
    const formattedCode = typeof rawCode === 'string' ? rawCode.trim().toUpperCase() : '';

    if (!CustomerCodeService.isValidFormat(formattedCode)) {
      res.status(400).json({
        success: false,
        error: `Invalid Customer Code format "${rawCode}". Expected 1 uppercase letter followed by 4 digits (e.g. A1024).`
      });
      return;
    }

    const farmer = await dataRepository.getFarmerByCustomerCode(formattedCode);
    if (!farmer) {
      res.status(404).json({
        success: false,
        error: `Customer not found with code: ${formattedCode}`
      });
      return;
    }

    // Get customer tests history
    const allTests = await dataRepository.getTests();
    const farmerTests = allTests.filter(t => t.farmerId === farmer.farmerId || t.customerCode === formattedCode);

    res.json({
      success: true,
      data: {
        ...farmer,
        tests: farmerTests
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const createFarmer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, mobile, village, animalType, address, notes, status, customerCode } = req.body;

    if (!name || !mobile || !village) {
      res.status(400).json({ success: false, error: 'Name, mobile and village are required fields' });
      return;
    }

    if (customerCode && !CustomerCodeService.isValidFormat(customerCode)) {
      res.status(400).json({
        success: false,
        error: `Invalid Customer Code format "${customerCode}". Expected 1 uppercase letter followed by 4 digits (e.g. A1024).`
      });
      return;
    }

    const created = await dataRepository.addFarmer({
      name,
      mobile,
      village,
      customerCode,
      animalType: animalType || 'COW',
      address,
      notes,
      status: status || 'ACTIVE'
    });

    const user = (req as any).user;
    if (user) {
      await dataRepository.addAuditLog({
        userId: user.userId,
        userName: user.name,
        role: user.role,
        action: 'CREATE_CUSTOMER',
        entityType: 'CUSTOMER',
        entityId: created.farmerId,
        customerCode: created.customerCode,
        details: `Customer account created: ${created.name} (Code: ${created.customerCode}, Village: ${created.village})`,
        ipAddress: req.ip || '127.0.0.1'
      });
    }

    res.status(201).json({ success: true, data: created });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateFarmer = async (req: Request, res: Response): Promise<void> => {
  try {
    const updated = await dataRepository.updateFarmer(req.params.id, req.body);
    if (!updated) {
      res.status(404).json({ success: false, error: 'Farmer not found' });
      return;
    }

    const user = (req as any).user;
    if (user) {
      await dataRepository.addAuditLog({
        userId: user.userId,
        userName: user.name,
        role: user.role,
        action: 'UPDATE_CUSTOMER',
        entityType: 'CUSTOMER',
        entityId: updated.farmerId,
        customerCode: updated.customerCode,
        details: `Customer account updated: ${updated.name} (Code: ${updated.customerCode})`,
        ipAddress: req.ip || '127.0.0.1'
      });
    }

    res.json({ success: true, data: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteFarmer = async (req: Request, res: Response): Promise<void> => {
  try {
    const deleted = await dataRepository.deleteFarmer(req.params.id);
    if (!deleted) {
      res.status(404).json({ success: false, error: 'Farmer not found' });
      return;
    }

    const user = (req as any).user;
    if (user) {
      await dataRepository.addAuditLog({
        userId: user.userId,
        userName: user.name,
        role: user.role,
        action: 'UPDATE_CUSTOMER',
        entityType: 'CUSTOMER',
        entityId: req.params.id,
        details: `Customer record deleted / deactivated ID: ${req.params.id}`,
        ipAddress: req.ip || '127.0.0.1'
      });
    }

    res.json({ success: true, message: 'Farmer deactivated/deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
